export const SALES_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_company_info',
      description: 'Search company documentation for accurate pricing, features, security compliance (SOC-2/HIPAA), or integrations. Call this whenever the prospect asks about product details, costs, or technical specs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query, e.g. "pricing plans", "HIPAA compliance", or "CRM integrations"',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_calendar_availability',
      description: 'Check available meeting times for a demo with the sales engineering team for a given date.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'The requested date, e.g. "tomorrow", "Friday", or "2026-11-26"',
          },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_calendar_appointment',
      description: 'Book a confirmed demo meeting on the calendar and issue a Google Meet link.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date for the demo meeting, e.g. "tomorrow" or "2026-11-26"',
          },
          time: {
            type: 'string',
            description: 'Time for the demo, e.g. "3:00 PM IST"',
          },
          prospectName: {
            type: 'string',
            description: 'Name of the prospect',
          },
          prospectEmail: {
            type: 'string',
            description: 'Email of the prospect if mentioned, or default to lead@company.com',
          },
        },
        required: ['date', 'time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_lead_qualification',
      description: 'Update the BANT (Budget, Authority, Need, Timeline) qualification details for this prospect as they are uncovered during conversation.',
      parameters: {
        type: 'object',
        properties: {
          budget: {
            type: 'string',
            description: 'Extracted budget status, e.g. "$500/mo", "Enterprise budget", "No budget"',
          },
          authority: {
            type: 'string',
            description: 'Decision maker role, e.g. "VP of Sales", "Founder", "Evaluating for manager"',
          },
          need: {
            type: 'string',
            description: 'Core pain point or requirement described by prospect',
          },
          timeline: {
            type: 'string',
            description: 'Expected implementation timeline, e.g. "Immediate", "Within 1 month", "Q1"',
          },
        },
      },
    },
  },
];
