import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'ops-ai-dev',
  // Vercel integration auto-injects INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY
  // No manual configuration needed
});
