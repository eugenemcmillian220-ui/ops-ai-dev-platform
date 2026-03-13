import { addBuildLog, updateProject } from '@/lib';

export async function netlifyAgent(
  projectId: string,
  repoUrl: string,
  appName: string,
  envVars: Record<string, string>
): Promise<{ deployUrl: string | null; error?: string }> {
  await addBuildLog(projectId, 'netlify', 'Creating Netlify backup deploy...', 'info');
  await updateProject(projectId, { current_step: 'netlify', progress: 90 });

  const token = process.env.NETLIFY_ACCESS_TOKEN;
  if (!token) {
    const error = 'NETLIFY_ACCESS_TOKEN not configured';
    await addBuildLog(projectId, 'netlify', error, 'warn');
    return { deployUrl: null, error };
  }

  try {
    const siteName = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 30);
    
    // Create site
    const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${siteName}-backup`,
        repo: {
          provider: 'github',
          repo_path: repoUrl.replace('https://github.com/', ''),
          repo_branch: 'main',
          dir: '.',
          deploy_key_id: null,
          installation_id: null,
        },
        build_settings: {
          cmd: 'npm run build',
          dir: 'dist',
          functions_dir: 'netlify/functions',
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Netlify create error: ${err}`);
    }

    const site = await createRes.json();
    const deployUrl = `https://${site.ssl_url || site.url}`;

    // Set env vars
    for (const [key, value] of Object.entries(envVars)) {
      await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/env`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
        }),
      });
    }

    await updateProject(projectId, { netlify_url: deployUrl });
    await addBuildLog(projectId, 'netlify', `Backup deployed to ${deployUrl}`, 'info');

    return { deployUrl };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await addBuildLog(projectId, 'netlify', `Failed: ${error}`, 'warn');
    return { deployUrl: null, error };
  }
}
