import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { logger } from '../utils/logger.js';

export class DeepgramService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.deepgram = apiKey ? createClient(apiKey) : null;
    this.connection = null;
    this.isReady = false;
  }

  async startLiveSession({ onTranscript, onUtteranceEnd, onError, sampleRate = 16000, language = 'multi' }) {
    if (!this.apiKey) {
      logger.warn('Deepgram API key is missing. Deepgram streaming will not be active.');
      return null;
    }

    try {
      this.connection = this.deepgram.listen.live({
        model: 'nova-2',
        language: language, // 'multi', 'en', 'hi'
        smart_format: true,
        interim_results: true,
        punctuate: true,
        vad_events: true,
        endpointing: 350, // 350ms of silence indicates end of turn
        encoding: 'linear16',
        sample_rate: sampleRate,
      });

      this.connection.on(LiveTranscriptionEvents.Open, () => {
        this.isReady = true;
        logger.voice('Deepgram live STT connection established (16kHz linear16)');
      });

      this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alternative = data.channel?.alternatives?.[0];
        const transcript = alternative?.transcript || '';
        const isFinal = Boolean(data.is_final);
        const speechFinal = Boolean(data.speech_final);

        if (transcript.trim().length > 0) {
          onTranscript({
            transcript,
            isFinal,
            speechFinal,
            confidence: alternative?.confidence || 0,
            words: alternative?.words || []
          });
        }
      });

      this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        logger.voice('Deepgram UtteranceEnd triggered (user pause)');
        if (onUtteranceEnd) onUtteranceEnd();
      });

      this.connection.on(LiveTranscriptionEvents.Error, (err) => {
        logger.error('Deepgram live STT error:', err);
        if (onError) onError(err);
      });

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        this.isReady = false;
        logger.voice('Deepgram live STT connection closed');
      });

      return this.connection;
    } catch (err) {
      logger.error('Failed to initiate Deepgram live session:', err);
      if (onError) onError(err);
      throw err;
    }
  }

  sendAudio(audioBuffer) {
    if (this.connection && this.isReady) {
      // Audio buffer should be Int16Array PCM buffer or Buffer
      this.connection.send(audioBuffer);
    }
  }

  close() {
    if (this.connection) {
      try {
        this.connection.finish();
      } catch (e) {
        // ignore already closed
      }
      this.connection = null;
      this.isReady = false;
    }
  }
}
