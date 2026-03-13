import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'ops-ai-dev',
  // Vercel integration auto-sets INNGEST_SIGNING_KEY
  // Event key falls back to signing key or 'dev' for local
  eventKey: process.env.INNGEST_EVENT_KEY || 
            process.env.INNGEST_SIGNING_KEY || 
            'dev',
});
