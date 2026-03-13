import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'ops-ai-dev',
  eventKey: process.env.INNGEST_EVENT_KEY || 'dev',
});
