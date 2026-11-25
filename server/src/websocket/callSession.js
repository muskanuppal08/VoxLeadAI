import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { DEFAULT_SALES_AGENT_PROMPT } from './prompts/salesAgentPrompt.js';

export class CallSession {
  constructor({ id, ws, deepgramService, elevenlabsService, openaiService, leadInfo = null }) {
    this.id = id || uuidv4();
    this.ws = ws;
    this.deepgramService = deepgramService;
    this.elevenlabsService = elevenlabsService;
    this.openaiService = openaiService;
    this.leadInfo = leadInfo;

    // State machine: 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted'
    this.status = 'idle';
    this.conversationHistory = [];
    this.currentUtteranceBuffer = '';
    this.speechEndTimer = null;

    // Abort controller for active LLM generation
    this.abortController = null;
    // Active ElevenLabs stream session
    this.activeTtsSession = null;

    // System prompt with lead details if provided
    this.systemPrompt = this.buildSystemPrompt();

    logger.voice(`CallSession initialized [${this.id}]`);
  }

  buildSystemPrompt() {
    let prompt = DEFAULT_SALES_AGENT_PROMPT;
    if (this.leadInfo) {
      prompt += `\n\nPROSPECT DETAILS:\nName: ${this.leadInfo.name || 'Unknown'}\nCompany: ${this.leadInfo.company || 'Unknown'}\nInitial Interest: ${this.leadInfo.interest || 'Exploring SalesPilot AI'}`;
    }
    return prompt;
  }

  async start() {
    this.status = 'listening';
    this.sendStatus('listening');

    // Initialize Deepgram STT stream
    if (this.deepgramService?.apiKey) {
      await this.deepgramService.startLiveSession({
        onTranscript: (data) => this.handleSttTranscript(data),
        onUtteranceEnd: () => this.handleUtteranceEnd(),
        onError: (err) => logger.error(`[${this.id}] Deepgram STT error:`, err),
      });
    }

    // Send welcome greeting if conversation is brand new
    if (this.conversationHistory.length === 0) {
      await this.sendInitialGreeting();
    }
  }

  async sendInitialGreeting() {
    const greetingText = "Hello! Thanks for connecting with SalesPilot AI. I'm Alex. How can I help you today?";
    this.conversationHistory.push({ role: 'assistant', content: greetingText });
    
    this.sendJson({
      type: 'transcript_final',
      speaker: 'agent',
      text: greetingText,
    });

    await this.synthesizeAndPlaySpeech(greetingText);
  }

  /**
   * Processes incoming binary audio chunks from client's microphone
   */
  handleAudioChunk(audioBuffer) {
    if (this.status === 'speaking') {
      // User may be interrupting the agent
      // Note: Full interruption is finalized when STT recognizes user speech or client sends 'user_interrupt'
    }

    if (this.deepgramService) {
      this.deepgramService.sendAudio(audioBuffer);
    }
  }

  /**
   * Real-time STT callback from Deepgram
   */
  handleSttTranscript({ transcript, isFinal, speechFinal }) {
    if (!transcript || transcript.trim().length === 0) return;

    // If agent is currently speaking and user speaks, trigger barge-in / interruption immediately!
    if (this.status === 'speaking' || this.status === 'thinking') {
      logger.voice(`[${this.id}] User interruption detected during: ${this.status}`);
      this.interruptAgent();
    }

    // Forward interim transcript to client for real-time live subtitle display
    this.sendJson({
      type: 'transcript_interim',
      speaker: 'user',
      text: transcript,
      isFinal: isFinal,
    });

    if (isFinal) {
      this.currentUtteranceBuffer += (this.currentUtteranceBuffer ? ' ' : '') + transcript;

      // Reset speech end debounce timer
      if (this.speechEndTimer) clearTimeout(this.speechEndTimer);

      if (speechFinal) {
        this.finalizeUserTurn();
      } else {
        // Fallback debounce: if no more words arrive within 600ms, finalize user turn
        this.speechEndTimer = setTimeout(() => {
          this.finalizeUserTurn();
        }, 600);
      }
    }
  }

  handleUtteranceEnd() {
    if (this.currentUtteranceBuffer.trim().length > 0) {
      this.finalizeUserTurn();
    }
  }

  /**
   * Finalizes user turn and starts AI reasoning
   */
  async finalizeUserTurn() {
    if (this.speechEndTimer) {
      clearTimeout(this.speechEndTimer);
      this.speechEndTimer = null;
    }

    const finalQuery = this.currentUtteranceBuffer.trim();
    if (!finalQuery) return;

    this.currentUtteranceBuffer = '';
    this.status = 'thinking';
    this.sendStatus('thinking');

    // Notify client of final user transcript
    this.sendJson({
      type: 'transcript_final',
      speaker: 'user',
      text: finalQuery,
    });

    // Append user query to conversational context
    this.conversationHistory.push({ role: 'user', content: finalQuery });

    // Generate streaming AI response
    await this.generateAgentResponse();
  }

  /**
   * Orchestrates OpenAI streaming + sentence chunking + ElevenLabs TTS
   */
  async generateAgentResponse() {
    this.abortController = new AbortController();

    // Prepare ElevenLabs TTS session for this turn
    if (this.elevenlabsService?.apiKey) {
      this.activeTtsSession = this.elevenlabsService.createStreamSession({
        onAudioChunk: (audioBuffer, isFinal) => {
          if (this.status !== 'speaking') {
            this.status = 'speaking';
            this.sendStatus('speaking');
          }
          // Send audio frame to client (base64 or binary)
          this.sendJson({
            type: 'agent_audio_chunk',
            audio: audioBuffer.toString('base64'),
            isFinal: Boolean(isFinal),
          });
        },
        onDone: () => {
          logger.voice(`[${this.id}] Agent finished speaking turn`);
          this.status = 'listening';
          this.sendStatus('listening');
        },
        onError: (err) => logger.error(`[${this.id}] TTS stream error:`, err),
      });
    }

    let fullAgentResponse = '';

    await this.openaiService.streamResponse({
      messages: this.conversationHistory,
      systemPrompt: this.systemPrompt,
      signal: this.abortController.signal,
      onToken: (token) => {
        // Stream text token for live subtitles
        this.sendJson({
          type: 'agent_text_token',
          token: token,
        });
      },
      onSentence: (sentence) => {
        logger.voice(`[${this.id}] Sentence ready for TTS: "${sentence}"`);
        if (this.activeTtsSession) {
          this.activeTtsSession.sendText(sentence);
        }
      },
      onComplete: ({ text, toolCalls }) => {
        fullAgentResponse = text;
        this.conversationHistory.push({ role: 'assistant', content: text });

        this.sendJson({
          type: 'transcript_final',
          speaker: 'agent',
          text: text,
        });

        // Close ElevenLabs input stream so it generates trailing audio
        if (this.activeTtsSession) {
          this.activeTtsSession.endStream();
        } else {
          // If no TTS service configured, return to listening directly
          this.status = 'listening';
          this.sendStatus('listening');
        }
      },
      onError: (err) => {
        logger.error(`[${this.id}] AI generation error:`, err.message);
        const fallbackText = "I'm Alex from SalesPilot AI. I heard your question! To enable dynamic AI completions, please configure your OPENAI_API_KEY in the server .env file.";
        this.conversationHistory.push({ role: 'assistant', content: fallbackText });
        this.sendJson({
          type: 'transcript_final',
          speaker: 'agent',
          text: fallbackText,
        });
        this.status = 'listening';
        this.sendStatus('listening');
      },
    });
  }

  /**
   * Synthesizes standalone speech (used for initial greeting or tool announcements)
   */
  async synthesizeAndPlaySpeech(text) {
    if (!this.elevenlabsService?.apiKey) return;

    this.status = 'speaking';
    this.sendStatus('speaking');

    const session = this.elevenlabsService.createStreamSession({
      onAudioChunk: (audioBuffer, isFinal) => {
        this.sendJson({
          type: 'agent_audio_chunk',
          audio: audioBuffer.toString('base64'),
          isFinal: Boolean(isFinal),
        });
      },
      onDone: () => {
        this.status = 'listening';
        this.sendStatus('listening');
      },
      onError: (err) => logger.error('Greeting TTS error:', err),
    });

    if (session) {
      session.sendText(text);
      session.endStream();
    }
  }

  /**
   * Barge-in handler: immediately cuts off agent output
   */
  interruptAgent() {
    this.status = 'interrupted';
    logger.voice(`[${this.id}] Interrupting agent playback and LLM stream.`);

    // 1. Abort LLM stream
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // 2. Terminate ElevenLabs TTS session
    if (this.activeTtsSession) {
      this.activeTtsSession.abort();
      this.activeTtsSession = null;
    }

    // 3. Instruct client to immediately flush and stop audio buffer playback
    this.sendJson({
      type: 'flush_audio_buffer',
      message: 'Agent speech interrupted by user',
    });

    // 4. Return to listening
    this.status = 'listening';
    this.sendStatus('listening');
  }

  sendStatus(status) {
    this.sendJson({
      type: 'agent_status_change',
      status: status, // 'listening' | 'thinking' | 'speaking' | 'interrupted'
    });
  }

  sendJson(payload) {
    if (this.ws && this.ws.readyState === 1) { // 1 = OPEN
      this.ws.send(JSON.stringify(payload));
    }
  }

  destroy() {
    logger.voice(`Destroying CallSession [${this.id}]`);
    if (this.speechEndTimer) clearTimeout(this.speechEndTimer);
    if (this.abortController) this.abortController.abort();
    if (this.activeTtsSession) this.activeTtsSession.abort();
    if (this.deepgramService) this.deepgramService.close();
  }
}
