import { addBuildLog, updateProject, encryptObject } from '@/lib';

export async function vercelAgent(
  projectId: string,
  repoUrl: string,
  appName: string,
  envVars: Record<string, string>
): Promise<{ deployUrl: string | null; error?: string }> {
  await addBuildLog(projectId, 'vercel', 'Deploying to Vercel...', 'info');
  await updateProject(projectId, { current_step: 'vercel', progress: 80 });

  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    const error = 'VERCEL_API_TOKEN not configured';
    await addBuildLog(projectId, 'vercel', error, 'error');
    return { deployUrl: null, error };
  }

  try {
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || appName;
    
    // Create project
    const createRes = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 30),
        framework: 'nextjs',
        gitRepository: {
          type: 'github',
          repo: repoUrl.replace('https://github.com/', ''),
        },
        buildCommand: 'next build',
        outputDirectory: 'dist',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Vercel create error: ${err}`);
    }

    const project = await createRes.json();
    await addBuildLog(projectId, 'vercel', `Created project: ${project.name}`, 'info');

    // Encrypt and set env vars
    for (const [key, value] of Object.entries(envVars)) {
      await fetch(`https://api.vercel.com/v9/projects/${project.id}/env`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value: encryptObject({ value }),
          type: 'encrypted',
          target: ['production', 'preview', 'development'],
        }),
      });
    }

    // Trigger deployment
    const deployRes = await fetch(`https://api.vercel.com/v9/projects/${project.id}/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: 'production',
        gitSource: {
          type: 'github',
          repo: repoUrl.replace('https://github.com/', ''),
          ref: 'main',
        },
      }),
    });

    if (!deployRes.ok) {
      const err = await deployRes.text();
      throw new Error(`Vercel deploy error: ${err}`);
    }

    const deployment = await deployRes.json();
    const deployUrl = `https://${deployment.url}`;

    await updateProject(projectId, { vercel_url: deployUrl });
    await addBuildLog(projectId, 'vercel', `Deployed to ${deployUrl}`, 'info');

    return { deployUrl };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await addBuildLog(projectId, 'vercel', `Failed: ${error}`, 'error');
    return { deployUrl: null, error };
  }
}
