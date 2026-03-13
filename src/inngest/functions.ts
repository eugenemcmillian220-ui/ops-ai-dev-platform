import { inngest } from './client';
import { supabaseAdmin, addBuildLog, updateProject, refundCredits } from '@/lib';
import { selfHealer } from '@/agents';

// Self-healer cron - runs every 2 minutes
export const selfHealerCron = inngest.createFunction(
  { id: 'self-healer-cron' },
  { cron: '*/2 * * * *' },
  async ({ step }) => {
    // Find failed projects that haven't been healed yet
    const { data: failedProjects } = await supabaseAdmin
      .from('projects')
      .select('id, user_id, encrypted_secrets')
      .eq('status', 'failed')
      .not('encrypted_secrets', 'like', '%healer_diagnosis%');

    if (!failedProjects || failedProjects.length === 0) {
      return { message: 'No failed projects to heal' };
    }

    const results = [];

    for (const project of failedProjects) {
      await step.run(`heal-project-${project.id}`, async () => {
        // Get latest error from build logs
        const { data: logs } = await supabaseAdmin
          .from('build_logs')
          .select('message')
          .eq('project_id', project.id)
          .eq('level', 'error')
          .order('created_at', { ascending: false })
          .limit(5);

        const errorLog = logs?.map(l => l.message).join('\n') || 'Unknown error';

        const result = await selfHealer(project.id, project.user_id, errorLog);
        
        return {
          projectId: project.id,
          ...result,
        };
      });

      results.push({ projectId: project.id, healed: true });
    }

    return { healed: results.length, projects: results };
  }
);

// Pipeline runner function
export const runPipeline = inngest.createFunction(
  { id: 'run-pipeline' },
  { event: 'pipeline/start' },
  async ({ event, step }) => {
    const { userId, projectId, prompt } = event.data;

    await step.run('init-pipeline', async () => {
      await addBuildLog(projectId, 'pipeline', 'Pipeline job started', 'info');
    });

    // Run requirements agent
    const requirements = await step.run('requirements', async () => {
      const { requirementsAgent } = await import('@/agents');
      return await requirementsAgent(projectId, prompt);
    });

    // Run schema agent
    const schema = await step.run('schema', async () => {
      const { schemaAgent } = await import('@/agents');
      return await schemaAgent(projectId, requirements);
    });

    // Run architecture agent
    const architecture = await step.run('architecture', async () => {
      const { architectureAgent } = await import('@/agents');
      return await architectureAgent(projectId, requirements);
    });

    // Run UI agent
    const ui = await step.run('ui', async () => {
      const { uiAgent } = await import('@/agents');
      return await uiAgent(projectId, requirements.pages, architecture.techStack);
    });

    // Run code agent
    const code = await step.run('code', async () => {
      const { codeAgent } = await import('@/agents');
      return await codeAgent(projectId, architecture.fileStructure, architecture);
    });

    // Merge UI code into codebase
    const fullCode = { ...code, ...ui };

    // Run GitHub agent
    const github = await step.run('github', async () => {
      const { githubAgent } = await import('@/agents');
      return await githubAgent(projectId, userId, requirements.appName, fullCode);
    });

    // Run Vercel agent
    const vercel = await step.run('vercel', async () => {
      if (!github.repoUrl) return null;
      const { vercelAgent } = await import('@/agents');
      const envVars: Record<string, string> = {};
      if (architecture.envVars) {
        architecture.envVars.forEach((e: { name: string; required: boolean }) => {
          if (e.required) envVars[e.name] = 'placeholder';
        });
      }
      return await vercelAgent(projectId, github.repoUrl, requirements.appName, envVars);
    });

    // Run Netlify agent (backup)
    const netlify = await step.run('netlify', async () => {
      if (!github.repoUrl) return null;
      const { netlifyAgent } = await import('@/agents');
      const envVars: Record<string, string> = {};
      if (architecture.envVars) {
        architecture.envVars.forEach((e: { name: string; required: boolean }) => {
          if (e.required) envVars[e.name] = 'placeholder';
        });
      }
      return await netlifyAgent(projectId, github.repoUrl, requirements.appName, envVars);
    });

    await step.run('complete', async () => {
      await updateProject(projectId, {
        status: vercel?.deployUrl ? 'deployed' : 'failed',
        current_step: vercel?.deployUrl ? 'complete' : 'failed',
        progress: 100,
        repo_url: github.repoUrl,
        vercel_url: vercel?.deployUrl,
        netlify_url: netlify?.deployUrl,
      });
    });

    return {
      success: !!vercel?.deployUrl,
      repoUrl: github.repoUrl,
      vercelUrl: vercel?.deployUrl,
      netlifyUrl: netlify?.deployUrl,
    };
  }
);

// Export all functions
export const functions = [selfHealerCron, runPipeline];
