import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { VoiceWebSocketServer } from './src/websocket/wsServer.js';
import { calendarService } from './src/services/calendar.service.js';
import { knowledgeService } from './src/services/knowledge.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health & Diagnostic Route
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SalesPilot AI Voice Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    config: {
      deepgramConfigured: Boolean(config.deepgram.apiKey),
      openaiConfigured: Boolean(config.openai.apiKey),
      elevenlabsConfigured: Boolean(config.elevenlabs.apiKey),
      openaiModel: config.openai.model,
      elevenlabsVoice: config.elevenlabs.voiceId,
    },
    activeVoiceSessions: voiceWsServer ? voiceWsServer.getActiveSessionsCount() : 0,
  });
});

// Appointments REST Endpoint
app.get('/api/v1/appointments', (req, res) => {
  res.json({
    success: true,
    appointments: calendarService.getAppointments(),
  });
});

// Knowledge Docs REST Endpoint
app.get('/api/v1/knowledge', (req, res) => {
  res.json({
    success: true,
    documents: knowledgeService.documents,
  });
});

// Serve the Voice Pipeline Test Console
app.get('/test-voice', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-voice.html'));
});

// Initialize WebSocket Voice Server
const voiceWsServer = new VoiceWebSocketServer(server);

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  logger.success(`=======================================================`);
  logger.success(`🚀 SalesPilot AI Server running on http://localhost:${PORT}`);
  logger.success(`🎙️  WebSocket Voice Gateway ready at ws://localhost:${PORT}/ws/call`);
  logger.success(`🧪 Interactive Voice Test Console: http://localhost:${PORT}/test-voice`);
  logger.success(`=======================================================`);
});

export { app, server };
