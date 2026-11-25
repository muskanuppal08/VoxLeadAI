import { logger } from '../utils/logger.js';

// Pre-loaded, verified company knowledge base for VoxLeadAI
const VERIFIED_KNOWLEDGE_DOCS = [
  {
    id: 'pricing',
    title: 'Pricing & Plans',
    category: 'pricing',
    content: `
VoxLeadAI offers three transparent pricing plans:
1. Starter Plan: $199 per month. Includes 1,000 conversational voice minutes, basic CRM sync, English language support, and email support.
2. Growth Plan: $499 per month. Includes 5,000 conversational voice minutes, bilingual support (English & Hindi), Google Calendar demo booking, automatic BANT lead scoring, and webhooks. Best for growing inside sales teams.
3. Enterprise Plan: $1,299 per month. Unlimited voice minutes, custom voice cloning, dedicated account manager, SOC-2 Type II and HIPAA compliance, and custom CRM integrations.
All plans come with a 14-day free trial.
    `.trim()
  },
  {
    id: 'features',
    title: 'Core Features & Capabilities',
    category: 'features',
    content: `
VoxLeadAI is an autonomous AI sales voice agent designed for high-velocity sales teams. Key capabilities:
- Ultra-low latency voice conversation under 900 milliseconds.
- Natural speech barge-in and interruption: when a prospect speaks, the agent stops immediately without awkward delays.
- Full bilingual code-switching between English, Hindi, and Hinglish.
- Automatic BANT (Budget, Authority, Need, Timeline) qualification with live scoring.
- Automated appointment scheduling with Google Calendar integration and Google Meet links.
- Post-call executive summaries, sentiment analysis, and objection tagging.
    `.trim()
  },
  {
    id: 'security',
    title: 'Security, Privacy & Compliance',
    category: 'security',
    content: `
VoxLeadAI complies with global enterprise security standards:
- SOC-2 Type II certified.
- Full HIPAA compliance available for healthcare clients on Enterprise tier.
- End-to-end encryption using TLS 1.3 for voice streaming in transit and AES-256 encryption at rest.
- Zero customer voice training: Prospect conversation audio is never used to train third-party foundation models.
    `.trim()
  },
  {
    id: 'integrations',
    title: 'Integrations & Compatibility',
    category: 'integrations',
    content: `
VoxLeadAI seamlessly connects with modern sales stacks:
- CRMs: HubSpot, Salesforce, Pipedrive, Zoho CRM.
- Calendars: Google Calendar, Microsoft Outlook Calendar.
- Webhooks & API: REST API and Webhooks to push live lead updates into Slack, Zapier, or custom backends.
    `.trim()
  }
];

export class KnowledgeService {
  constructor() {
    this.documents = VERIFIED_KNOWLEDGE_DOCS;
  }

  /**
   * Searches company knowledge base for relevant facts
   * Uses semantic keyword & category matching
   */
  search(query) {
    logger.info(`Searching company knowledge base for: "${query}"`);
    const q = query.toLowerCase();

    // Score documents by relevance to query terms
    const scoredDocs = this.documents.map((doc) => {
      let score = 0;
      const terms = q.split(/\s+/).filter(w => w.length > 2);
      
      terms.forEach(term => {
        if (doc.category.toLowerCase().includes(term)) score += 5;
        if (doc.title.toLowerCase().includes(term)) score += 4;
        const matches = (doc.content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        score += matches * 2;
      });

      return { doc, score };
    });

    // Sort by relevance score
    scoredDocs.sort((a, b) => b.score - a.score);

    // Return top match or fallback if score > 0
    if (scoredDocs[0]?.score > 0) {
      return {
        found: true,
        title: scoredDocs[0].doc.title,
        content: scoredDocs[0].doc.content,
      };
    }

    // Default fallback to features overview if query is broad
    return {
      found: true,
      title: 'Company Overview',
      content: this.documents[1].content,
    };
  }
}

export const knowledgeService = new KnowledgeService();
