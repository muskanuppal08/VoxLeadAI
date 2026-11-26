import WebSocket from 'ws';
import { logger } from './src/utils/logger.js';

const WS_URL = 'ws://localhost:5001/ws/call?leadName=AutomatedTester&company=TestCorp';

async function runVoicePipelineTest() {
  logger.info('Starting Automated Voice Pipeline Verification Test...');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const testResults = {
      connected: false,
      receivedGreeting: false,
      receivedAgentTokens: false,
      receivedFinalAgentResponse: false,
      interruptionVerified: false,
    };

    const timeout = setTimeout(() => {
      logger.error('Test timed out after 20 seconds');
      ws.close();
      reject(new Error('Voice Pipeline Test Timeout'));
    }, 20000);

    ws.on('open', () => {
      logger.success('1. WebSocket connection successfully established to voice gateway');
      testResults.connected = true;
    });

    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'call_connected') {
        logger.success(`2. Call connected event received. Session ID: ${msg.sessionId}`);
      }

      if (msg.type === 'transcript_final' && msg.speaker === 'agent') {
        if (!testResults.receivedGreeting) {
          testResults.receivedGreeting = true;
          logger.success(`3. Received Agent Greeting: "${msg.text}"`);

          // Send simulated user inquiry (asking in Hindi/Hinglish to test multilingual handling)
          logger.info('4. Sending simulated multilingual user voice inquiry: "Hi Arohi, aapka pricing model kya hai?"');
          ws.send(JSON.stringify({
            type: 'text_input',
            text: 'Hi Arohi, aapka pricing model kya hai?',
          }));
        } else {
          testResults.receivedFinalAgentResponse = true;
          logger.success(`6. Received Final Agent Answer: "${msg.text}"`);

          // Now test user interruption mechanism
          logger.info('7. Testing user interruption (barge-in signal)...');
          ws.send(JSON.stringify({ type: 'user_interrupt' }));
        }
      }

      if (msg.type === 'agent_text_token') {
        testResults.receivedAgentTokens = true;
      }

      if (msg.type === 'agent_status_change') {
        logger.voice(`Agent Status Transitioned To: [${msg.status}]`);
      }

      if (msg.type === 'flush_audio_buffer') {
        testResults.interruptionVerified = true;
        logger.success('8. Server successfully emitted flush_audio_buffer on interruption!');

        clearTimeout(timeout);
        ws.send(JSON.stringify({ type: 'hangup' }));
        ws.close();

        logger.success('====================================================');
        logger.success('🎉 ALL MODULE 1 REAL-TIME VOICE PIPELINE TESTS PASSED!');
        logger.success('====================================================');
        resolve(testResults);
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket client error during test:', err);
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Run test if invoked directly
runVoicePipelineTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
