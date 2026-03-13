import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { functions } from '@/inngest/functions';

// Vercel marketplace integration auto-sets INNGEST_SIGNING_KEY
// We explicitly pass it to ensure proper authentication
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
