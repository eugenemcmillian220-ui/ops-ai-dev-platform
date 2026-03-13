import {
  requirementsAgent,
  schemaAgent,
  architectureAgent,
  uiAgent,
  codeAgent,
  githubAgent,
  vercelAgent,
  netlifyAgent,
  selfHealer,
  neonAgent,
} from '@/agents';
import { supabaseAdmin, addBuildLog, updateProject } from './db';
import { enforceCredits, refundCredits } from './credits';
import { inngest } from '@/inngest/client';

export interface PipelineState {
  projectId: string;
  userId: string;
  prompt: string;
  name: string;
  requirements?: any;
  schema?: any;
  architecture?: any;
  pages?: Record<string, string>;
  files?: Record<string, string>;
  database?: any;
  repoUrl?: string;
  vercelUrl?: string;
  netlifyUrl?: string;
  step: string;
  error?: string;
}

export async function startPipeline(
  userId: string,
  prompt: string,
  name?: string
): Promise<PipelineState> {
  // Create project in database
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: userId,
      name: name || 'Untitled Project',
      prompt,
      status: 'draft',
      current_step: 'requirements',
      progress: 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create project: ${error?.message}`);
  }

  return {
    projectId: data.id,
    userId,
    prompt,
    name: name || 'Untitled Project',
    step: 'requirements',
  };
}

export async function runPipelineStep(state: PipelineState): Promise<PipelineState> {
  switch (state.step) {
    case 'requirements': {
      state.requirements = await requirementsAgent(state.projectId, state.prompt);
      state.step = 'schema';
      await updateProject(state.projectId, { current_step: 'schema', progress: 10 });
      break;
    }

    case 'schema': {
      state.schema = await schemaAgent(state.projectId, state.requirements);
      state.step = 'neon';
      await updateProject(state.projectId, { current_step: 'neon', progress: 20 });
      break;
    }

    case 'neon': {
      // Create Neon database for this app
      const neonResult = await neonAgent(
        state.projectId,
        state.userId,
        state.requirements?.appName || 'app',
        state.schema
      );
      state.database = neonResult.database;
      state.step = 'architecture';
      await updateProject(state.projectId, { current_step: 'architecture', progress: 30 });
      break;
    }

    case 'architecture': {
      state.architecture = await architectureAgent(state.projectId, state.requirements);
      state.step = 'ui';
      await updateProject(state.projectId, { current_step: 'ui', progress: 40 });
      break;
    }

    case 'ui': {
      state.pages = await uiAgent(
        state.projectId,
        state.architecture?.pages || [],
        { styling: state.architecture?.techStack?.styling || 'Tailwind CSS' }
      );
      state.step = 'code';
      await updateProject(state.projectId, { current_step: 'code', progress: 60 });
      break;
    }

    case 'code': {
      state.files = await codeAgent(
        state.projectId,
        state.architecture?.fileStructure || [],
        { techStack: state.architecture?.techStack || {} }
      );
      state.step = 'github';
      await updateProject(state.projectId, { current_step: 'github', progress: 80 });
      break;
    }

    case 'github': {
      const result = await githubAgent(state.projectId, state.userId, state.name, state.files || {});
      state.repoUrl = result.repoUrl;
      state.error = result.error;
      state.step = result.error ? 'failed' : 'vercel';
      await updateProject(state.projectId, { 
        repo_url: result.repoUrl, 
        current_step: result.error ? 'failed' : 'vercel',
        status: result.error ? 'failed' : 'deploying',
        progress: 85 
      });
      break;
    }

    case 'vercel': {
      if (!state.repoUrl) {
        state.step = 'netlify';
        break;
      }
      const result = await vercelAgent(state.projectId, state.repoUrl, state.name, {});
      state.vercelUrl = result.deployUrl || undefined;
      state.step = 'netlify';
      await updateProject(state.projectId, { 
        vercel_url: result.deployUrl,
        current_step: 'netlify',
        progress: 90 
      });
      break;
    }

    case 'netlify': {
      if (!state.repoUrl) {
        state.step = 'complete';
        break;
      }
      const result = await netlifyAgent(state.projectId, state.repoUrl, state.name, {});
      state.netlifyUrl = result.deployUrl || undefined;
      state.step = 'complete';
      await updateProject(state.projectId, { 
        netlify_url: result.deployUrl,
        current_step: 'complete',
        status: 'completed',
        progress: 100 
      });
      break;
    }

    case 'complete': {
      await updateProject(state.projectId, { status: 'completed', progress: 100 });
      break;
    }

    case 'failed': {
      await updateProject(state.projectId, { status: 'failed' });
      // Refund credits on failure
      await refundCredits(state.userId, state.projectId, 1);
      await addBuildLog(state.projectId, 'system', 'Pipeline failed. Credits refunded.', 'error');
      break;
    }
  }

  return state;
}

export async function runFullPipeline(userId: string, prompt: string, name?: string): Promise<PipelineState> {
  const creditCheck = await enforceCredits(userId, 'new-project', 1);
  if (!creditCheck.allowed) {
    throw new Error('Insufficient credits');
  }

  let state = await startPipeline(userId, prompt, name);

  while (state.step !== 'complete' && !state.error) {
    state = await runPipelineStep(state);
  }

  return state;
}
