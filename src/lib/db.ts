import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  status: string;
  current_step: string;
  progress: number;
  repo_url: string | null;
  vercel_url: string | null;
  netlify_url: string | null;
  encrypted_secrets: string;
  created_at: string;
  updated_at: string;
};

export type BuildLog = {
  id: string;
  project_id: string;
  agent: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  created_at: string;
};

export async function createProject(
  userId: string,
  name: string,
  prompt: string,
  description?: string
): Promise<Project> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ user_id: userId, name, prompt, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) throw error;
}

export async function addBuildLog(
  projectId: string,
  agent: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info'
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('build_logs')
    .insert({ project_id: projectId, agent, message, level });
  if (error) console.error('Failed to add build log:', error);
}

export async function getUserById(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserCredits(userId: string, credits: number) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ credits, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function addCreditTransaction(
  userId: string,
  type: string,
  amount: number,
  description: string,
  projectId?: string,
  stripePaymentIntentId?: string
) {
  const { error } = await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    project_id: projectId,
    type,
    amount,
    description,
    stripe_payment_intent_id: stripePaymentIntentId,
  });
  if (error) throw error;
}
