import { WebSocketServer } from 'ws';
import url from 'url';
import { CallSession } from './callSession.js';
import { DeepgramService } from '../services/deepgram.service.js';
import { ElevenLabsService } from '../services/elevenlabs.service.js';
import { OpenAIService } from '../services/openai.service.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class VoiceWebSocketServer {
  constructor(httpServer) {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/ws/call',
    });

    this.activeSessions = new Map();
    this.init();
  }

  init() {
    logger.info('Voice WebSocket Server initialized on path /ws/call');

    this.wss.on('connection', async (ws, req) => {
      const parsedUrl = url.parse(req.url, true);
      const query = parsedUrl.query;
      const sessionId = query.sessionId || query.leadId || undefined;

      logger.voice(`New WebSocket voice client connected [sessionId: ${sessionId || 'auto'}]`);

      // Initialize service instances for this session
      const deepgramService = new DeepgramService(config.deepgram.apiKey);
      const elevenlabsService = new ElevenLabsService({
        apiKey: config.elevenlabs.apiKey,
        voiceId: config.elevenlabs.voiceId,
        modelId: config.elevenlabs.modelId,
      });
      const openaiService = new OpenAIService({
        apiKey: config.openai.apiKey,
        model: config.openai.model,
      });

      const session = new CallSession({
        id: sessionId,
        ws,
        deepgramService,
        elevenlabsService,
        openaiService,
        leadInfo: query.leadName ? { name: query.leadName, company: query.company } : null,
      });

      this.activeSessions.set(session.id, session);

      // Confirm connection
      ws.send(JSON.stringify({
        type: 'call_connected',
        sessionId: session.id,
        sampleRate: 16000,
        message: 'SalesPilot Voice Agent connected and ready',
      }));

      // Start the voice session lifecycle
      try {
        await session.start();
      } catch (err) {
        logger.error(`Error starting session [${session.id}]:`, err);
      }

      // Handle incoming messages
      ws.on('message', async (data, isBinary) => {
        try {
          if (isBinary) {
            // Binary data is raw audio chunk (Int16Array PCM from microphone)
            session.handleAudioChunk(data);
          } else {
            // Text JSON control message
            const message = JSON.parse(data.toString());

            switch (message.type) {
              case 'user_interrupt':
                session.interruptAgent();
                break;

              case 'text_input':
                // Allows direct text input testing alongside voice
                if (message.text) {
                  session.currentUtteranceBuffer = message.text;
                  await session.finalizeUserTurn();
                }
                break;

              case 'hangup':
                logger.voice(`Client requested hangup [${session.id}]`);
                session.destroy();
                this.activeSessions.delete(session.id);
                ws.close(1000, 'Call ended by user');
                break;

              default:
                logger.warn(`Unknown message type received: ${message.type}`);
            }
          }
        } catch (err) {
          logger.error(`Error handling message in session [${session.id}]:`, err);
        }
      });

      ws.on('close', (code, reason) => {
        logger.voice(`WebSocket client disconnected [${session.id}] (code: ${code})`);
        session.destroy();
        this.activeSessions.delete(session.id);
      });

      ws.on('error', (err) => {
        logger.error(`WebSocket error in session [${session.id}]:`, err);
        session.destroy();
        this.activeSessions.delete(session.id);
      });
    });
  }

  getActiveSessionsCount() {
    return this.activeSessions.size;
  }
}
