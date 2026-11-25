import WebSocket from 'ws';
import { logger } from './src/utils/logger.js';

const WS_URL = 'ws://localhost:5001/ws/call?leadName=SarahConnor&company=CyberdyneSystems';

async function runToolCallingTest() {
  logger.info('Starting Automated AI Tool Calling & Grounding Test (Module 2)...');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const results = {
      greetingReceived: false,
      pricingToolExecuted: false,
      qualificationUpdated: false,
      bookingToolExecuted: false,
    };

    const timeout = setTimeout(() => {
      logger.error('Tool calling test timed out');
      ws.close();
      reject(new Error('Tool calling test timeout'));
    }, 20000);

    ws.on('open', () => {
      logger.success('1. Connected to Voice Gateway for Tool Verification');
    });

    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'transcript_final' && msg.speaker === 'agent') {
        if (!results.greetingReceived) {
          results.greetingReceived = true;
          logger.success(`2. Received Greeting: "${msg.text}"`);

          // Ask pricing question to trigger search_company_info
          logger.info('3. Inquiring about pricing: "What are your pricing plans?"');
          ws.send(JSON.stringify({
            type: 'text_input',
            text: 'What are your pricing plans and features?',
          }));
        } else if (results.pricingToolExecuted && !results.bookingToolExecuted) {
          logger.success(`5. Agent Spoke Grounded Answer: "${msg.text}"`);

          // Ask to book demo to trigger book_calendar_appointment
          logger.info('6. Inquiring to book demo: "Can we schedule a demo tomorrow at 3 PM?"');
          ws.send(JSON.stringify({
            type: 'text_input',
            text: 'Can we schedule a demo tomorrow at 3 PM?',
          }));
        } else if (results.bookingToolExecuted) {
          logger.success(`8. Agent Confirmed Booking Spoken: "${msg.text}"`);

          clearTimeout(timeout);
          ws.send(JSON.stringify({ type: 'hangup' }));
          ws.close();

          logger.success('====================================================');
          logger.success('🎉 ALL MODULE 2 TOOL CALLING & GROUNDING TESTS PASSED!');
          logger.success('====================================================');
          resolve(results);
        }
      }

      if (msg.type === 'tool_executed') {
        if (msg.toolName === 'search_company_info') {
          results.pricingToolExecuted = true;
          logger.success(`4. TOOL EXECUTED: [${msg.toolName}] -> Found: "${msg.result.title}"`);
        } else if (msg.toolName === 'book_calendar_appointment') {
          results.bookingToolExecuted = true;
          logger.success(`7. TOOL EXECUTED: [${msg.toolName}] -> Booking ID: ${msg.result.bookingId}, Link: ${msg.result.meetingLink}`);
        }
      }

      if (msg.type === 'qualification_updated') {
        results.qualificationUpdated = true;
        logger.voice(`BANT Score Updated: ${msg.qualification.bantScore}/100 [Budget: ${msg.qualification.budget}]`);
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket test error:', err);
      clearTimeout(timeout);
      reject(err);
    });
  });
}

runToolCallingTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
