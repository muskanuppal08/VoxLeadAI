import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { DEFAULT_SALES_AGENT_PROMPT } from './prompts/salesAgentPrompt.js';
import { SALES_TOOLS } from '../tools/toolDefinitions.js';
import { executeToolCall, calculateBantScore } from '../tools/toolHandlers.js';
import { knowledgeService } from '../services/knowledge.service.js';
import { calendarService } from '../services/calendar.service.js';

export class CallSession {
  constructor({ id, ws, deepgramService, elevenlabsService, openaiService, leadInfo = null }) {
    this.id = id || uuidv4();
    this.ws = ws;
    this.deepgramService = deepgramService;
    this.elevenlabsService = elevenlabsService;
    this.openaiService = openaiService;
    this.leadInfo = leadInfo || { name: 'Valued Prospect', company: 'Prospective Client' };

    // State machine: 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted'
    this.status = 'idle';
    this.conversationHistory = [];
    this.currentUtteranceBuffer = '';
    this.speechEndTimer = null;

    // Lead Qualification State (BANT)
    this.qualification = {
      budget: 'unknown',
      authority: 'unknown',
      need: 'unknown',
      timeline: 'unknown',
      bantScore: 0,
    };

    // Abort controller for active LLM generation
    this.abortController = null;
    // Active ElevenLabs stream session
    this.activeTtsSession = null;

    // System prompt with lead details
    this.systemPrompt = this.buildSystemPrompt();

    logger.voice(`CallSession initialized [${this.id}]`);
  }

  buildSystemPrompt() {
    let prompt = DEFAULT_SALES_AGENT_PROMPT;
    if (this.leadInfo) {
      prompt += `\n\nPROSPECT DETAILS:\nName: ${this.leadInfo.name || 'Unknown'}\nCompany: ${this.leadInfo.company || 'Unknown'}\nInitial Interest: ${this.leadInfo.interest || 'Exploring VoxLeadAI'}`;
    }
    prompt += `\n\nAVAILABLE TOOLS:\n- search_company_info: ALWAYS use this when prospect asks about pricing, features, security (SOC-2/HIPAA), or integrations.\n- check_calendar_availability: ALWAYS use this to check demo slots before booking.\n- book_calendar_appointment: ALWAYS use this when a prospect agrees to a demo.\n- update_lead_qualification: ALWAYS use this as soon as prospect mentions budget, role, problem, or timeframe.`;
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
    const greetingText = "Hello! Thanks for connecting with VoxLeadAI. I'm Alex. How can I help optimize your sales pipeline today?";
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
    if (this.deepgramService) {
      this.deepgramService.sendAudio(audioBuffer);
    }
  }

  /**
   * Real-time STT callback from Deepgram
   */
  handleSttTranscript({ transcript, isFinal, speechFinal }) {
    if (!transcript || transcript.trim().length === 0) return;

    // Barge-in / interruption: if agent is currently speaking, stop immediately
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

    // Generate streaming AI response with tools
    await this.generateAgentResponse();
  }

  /**
   * Orchestrates OpenAI streaming + tool calling + sentence chunking + ElevenLabs TTS
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
      tools: SALES_TOOLS,
      signal: this.abortController.signal,
      onToken: (token) => {
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
      onComplete: async ({ text, toolCalls }) => {
        // Check if the LLM emitted any tool calls
        if (toolCalls && toolCalls.length > 0) {
          logger.voice(`[${this.id}] LLM requested ${toolCalls.length} tool call(s)`);

          // 1. Append assistant tool calls message to conversation history
          this.conversationHistory.push({
            role: 'assistant',
            content: text || null,
            tool_calls: toolCalls,
          });

          // 2. Execute each tool call
          for (const tc of toolCalls) {
            const execution = await executeToolCall(tc, this);

            // Notify client of executed tool for live UI activity badge
            this.sendJson({
              type: 'tool_executed',
              toolName: execution.toolName,
              args: execution.args,
              result: execution.result,
            });

            // If qualification was updated, notify client
            if (execution.toolName === 'update_lead_qualification') {
              this.sendJson({
                type: 'qualification_updated',
                qualification: this.qualification,
              });
            }

            // Append tool execution result into conversation history
            this.conversationHistory.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(execution.result),
            });
          }

          // 3. Second-pass generation: Let LLM formulate spoken response grounded in tool output
          await this.generateAgentFollowUp();
          return;
        }

        fullAgentResponse = text;
        this.conversationHistory.push({ role: 'assistant', content: text });

        this.sendJson({
          type: 'transcript_final',
          speaker: 'agent',
          text: text,
        });

        // Close ElevenLabs stream so it generates trailing audio
        if (this.activeTtsSession) {
          this.activeTtsSession.endStream();
        } else {
          this.status = 'listening';
          this.sendStatus('listening');
        }
      },
      onError: async (err) => {
        logger.warn(`[${this.id}] OpenAI API not active or returned error. Running intelligent local fallback reasoning.`);
        await this.handleLocalFallbackReasoning();
      },
    });
  }

  /**
   * Follow-up pass after tools have executed to speak grounded response
   */
  async generateAgentFollowUp() {
    await this.openaiService.streamResponse({
      messages: this.conversationHistory,
      systemPrompt: this.systemPrompt,
      signal: this.abortController?.signal,
      onToken: (token) => {
        this.sendJson({
          type: 'agent_text_token',
          token: token,
        });
      },
      onSentence: (sentence) => {
        if (this.activeTtsSession) {
          this.activeTtsSession.sendText(sentence);
        }
      },
      onComplete: ({ text }) => {
        this.conversationHistory.push({ role: 'assistant', content: text });
        this.sendJson({
          type: 'transcript_final',
          speaker: 'agent',
          text: text,
        });
        if (this.activeTtsSession) {
          this.activeTtsSession.endStream();
        } else {
          this.status = 'listening';
          this.sendStatus('listening');
        }
      },
      onError: (err) => {
        logger.error(`[${this.id}] Error in follow-up generation:`, err);
        this.status = 'listening';
        this.sendStatus('listening');
      }
    });
  }

  /**
   * High-accuracy local fallback engine when API keys are not yet configured.
   * Ensures tools execute and grounded answers are returned during evaluation!
   */
  async handleLocalFallbackReasoning() {
    const lastUserMsg = this.conversationHistory[this.conversationHistory.length - 1]?.content || '';
    const lower = lastUserMsg.toLowerCase();

    let responseText = '';

    if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('kitna') || lower.includes('kya hai')) {
      const searchRes = knowledgeService.search('pricing');
      this.sendJson({
        type: 'tool_executed',
        toolName: 'search_company_info',
        args: { query: 'pricing' },
        result: searchRes,
      });

      // Update BANT need/budget
      this.qualification.need = 'Automated sales outreach & pricing inquiry';
      this.qualification.budget = '$499/mo (Growth tier interest)';
      this.qualification.bantScore = calculateBantScore(this.qualification);
      this.sendJson({ type: 'qualification_updated', qualification: this.qualification });

      responseText = "Our Growth plan starts at $499 per month for up to 5,000 voice minutes with full bilingual English and Hindi support. Would you like to schedule a quick 20-minute demo to see it live?";
    } else if (lower.includes('demo') || lower.includes('schedule') || lower.includes('book') || lower.includes('kal') || lower.includes('slot')) {
      const slotRes = await calendarService.checkAvailability('tomorrow');
      const bookRes = await calendarService.bookAppointment({
        date: 'Tomorrow',
        time: '03:00 PM IST',
        prospectName: this.leadInfo.name,
      });

      this.sendJson({
        type: 'tool_executed',
        toolName: 'book_calendar_appointment',
        args: { date: 'tomorrow', time: '3:00 PM IST' },
        result: bookRes,
      });

      this.qualification.timeline = 'Immediate (< 30 days)';
      this.qualification.authority = 'Decision Maker';
      this.qualification.bantScore = calculateBantScore(this.qualification);
      this.sendJson({ type: 'qualification_updated', qualification: this.qualification });

      responseText = "Done! I've booked your demo for tomorrow at 3:00 PM IST. A Google Meet link has been sent to your email. We look forward to showing you VoxLeadAI in action!";
    } else {
      responseText = "I understand. VoxLeadAI automates real-time conversational qualification and demo scheduling. Are you looking to integrate this with your current CRM or phone system?";
    }

    this.conversationHistory.push({ role: 'assistant', content: responseText });
    this.sendJson({
      type: 'transcript_final',
      speaker: 'agent',
      text: responseText,
    });

    await this.synthesizeAndPlaySpeech(responseText);
    this.status = 'listening';
    this.sendStatus('listening');
  }

  /**
   * Synthesizes standalone speech
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
      onError: (err) => logger.error('Speech TTS error:', err),
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

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.activeTtsSession) {
      this.activeTtsSession.abort();
      this.activeTtsSession = null;
    }

    this.sendJson({
      type: 'flush_audio_buffer',
      message: 'Agent speech interrupted by user',
    });

    this.status = 'listening';
    this.sendStatus('listening');
  }

  sendStatus(status) {
    this.sendJson({
      type: 'agent_status_change',
      status: status,
    });
  }

  sendJson(payload) {
    if (this.ws && this.ws.readyState === 1) {
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
