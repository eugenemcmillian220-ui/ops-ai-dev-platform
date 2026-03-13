import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { functions } from '@/inngest/functions';

// Vercel integration auto-configures auth
// No manual signingKey needed
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
