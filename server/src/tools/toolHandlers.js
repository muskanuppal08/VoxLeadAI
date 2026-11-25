import { knowledgeService } from '../services/knowledge.service.js';
import { calendarService } from '../services/calendar.service.js';
import { logger } from '../utils/logger.js';

export function calculateBantScore(qualification) {
  let score = 0;
  if (qualification.budget && qualification.budget !== 'unknown' && !qualification.budget.toLowerCase().includes('no')) {
    score += 25;
  }
  if (qualification.authority && (qualification.authority.toLowerCase().includes('decision') || qualification.authority.toLowerCase().includes('founder') || qualification.authority.toLowerCase().includes('vp') || qualification.authority.toLowerCase().includes('lead'))) {
    score += 25;
  } else if (qualification.authority && qualification.authority !== 'unknown') {
    score += 15;
  }
  if (qualification.need && qualification.need !== 'unknown') {
    score += 25;
  }
  if (qualification.timeline && (qualification.timeline.toLowerCase().includes('immediate') || qualification.timeline.toLowerCase().includes('month') || qualification.timeline.toLowerCase().includes('soon') || qualification.timeline.toLowerCase().includes('week'))) {
    score += 25;
  } else if (qualification.timeline && qualification.timeline !== 'unknown') {
    score += 10;
  }
  return Math.min(100, score);
}

export async function executeToolCall(toolCall, sessionContext = {}) {
  const { name, arguments: rawArgs } = toolCall.function;
  logger.voice(`Executing Tool Call: [${name}] with args:`, rawArgs);

  let args = {};
  try {
    args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
  } catch (err) {
    logger.error(`Error parsing args for tool ${name}:`, err);
  }

  let result = null;

  switch (name) {
    case 'search_company_info': {
      result = knowledgeService.search(args.query || 'pricing');
      break;
    }

    case 'check_calendar_availability': {
      result = await calendarService.checkAvailability(args.date || 'tomorrow');
      break;
    }

    case 'book_calendar_appointment': {
      result = await calendarService.bookAppointment({
        date: args.date,
        time: args.time,
        prospectName: args.prospectName || sessionContext.leadInfo?.name || 'Valued Prospect',
        prospectEmail: args.prospectEmail || 'prospect@company.com',
      });
      break;
    }

    case 'update_lead_qualification': {
      if (!sessionContext.qualification) {
        sessionContext.qualification = { budget: 'unknown', authority: 'unknown', need: 'unknown', timeline: 'unknown' };
      }
      if (args.budget) sessionContext.qualification.budget = args.budget;
      if (args.authority) sessionContext.qualification.authority = args.authority;
      if (args.need) sessionContext.qualification.need = args.need;
      if (args.timeline) sessionContext.qualification.timeline = args.timeline;

      sessionContext.qualification.bantScore = calculateBantScore(sessionContext.qualification);

      result = {
        success: true,
        qualification: sessionContext.qualification,
        message: `Lead qualification updated. Current BANT Score: ${sessionContext.qualification.bantScore}/100.`
      };
      break;
    }

    default:
      result = { error: `Tool ${name} is not recognized` };
  }

  return {
    toolCallId: toolCall.id,
    toolName: name,
    args,
    result,
  };
}
