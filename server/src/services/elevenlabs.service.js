import WebSocket from 'ws';
import { logger } from '../utils/logger.js';

export class ElevenLabsService {
  constructor({ apiKey, voiceId, modelId = 'eleven_turbo_v2_5' }) {
    this.apiKey = apiKey;
    this.voiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default Rachel
    this.modelId = modelId;
  }

  /**
   * Opens a bi-directional streaming WebSocket session with ElevenLabs
   * Allows piping text chunks as they arrive from LLM and receiving audio chunks in real-time.
   */
  createStreamSession({ onAudioChunk, onDone, onError }) {
    if (!this.apiKey) {
      logger.warn('ElevenLabs API key is missing. TTS streaming will not be active.');
      return null;
    }

    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=${this.modelId}&output_format=mp3_44100_128`;
    
    let ws;
    let isOpen = false;
    let pendingTextQueue = [];
    let isTerminated = false;

    try {
      ws = new WebSocket(wsUrl, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      ws.on('open', () => {
        isOpen = true;
        logger.voice('ElevenLabs TTS WebSocket session opened');

        // Initial setup payload to prime the model
        const initPayload = {
          text: ' ',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            optimize_streaming_latency: 3, // Highest low-latency setting
          },
          generation_config: {
            chunk_length_schedule: [120, 160, 250, 290],
          },
        };
        ws.send(JSON.stringify(initPayload));

        // Flush any text queued while connecting
        while (pendingTextQueue.length > 0 && isOpen) {
          const item = pendingTextQueue.shift();
          ws.send(JSON.stringify(item));
        }
      });

      ws.on('message', (data) => {
        if (isTerminated) return;
        try {
          const response = JSON.parse(data.toString());
          if (response.audio) {
            // response.audio is base64 encoded audio slice
            const audioBuffer = Buffer.from(response.audio, 'base64');
            onAudioChunk(audioBuffer, response.isFinal);
          }
          if (response.isFinal && onDone) {
            onDone();
          }
        } catch (err) {
          logger.error('Error parsing ElevenLabs message:', err);
        }
      });

      ws.on('error', (err) => {
        logger.error('ElevenLabs WebSocket error:', err);
        if (onError) onError(err);
      });

      ws.on('close', () => {
        isOpen = false;
        logger.voice('ElevenLabs WebSocket closed');
      });

      return {
        sendText: (text) => {
          if (isTerminated) return;
          const payload = {
            text: text,
            try_trigger_generation: true,
          };
          if (isOpen && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
          } else {
            pendingTextQueue.push(payload);
          }
        },
        endStream: () => {
          if (isOpen && ws.readyState === WebSocket.OPEN) {
            // Sending an empty string triggers ElevenLabs to finish remaining speech
            ws.send(JSON.stringify({ text: '' }));
          }
        },
        abort: () => {
          isTerminated = true;
          isOpen = false;
          pendingTextQueue = [];
          if (ws) {
            try {
              ws.terminate();
            } catch (e) {
              // ignore
            }
          }
        },
      };
    } catch (err) {
      logger.error('Failed to create ElevenLabs streaming session:', err);
      if (onError) onError(err);
      return null;
    }
  }

  /**
   * HTTP streaming fallback if WebSocket is not available
   */
  async streamSpeechHTTP(text) {
    if (!this.apiKey) return null;
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs HTTP stream failed with status ${response.status}`);
    }

    return response.body; // Web ReadableStream
  }
}
