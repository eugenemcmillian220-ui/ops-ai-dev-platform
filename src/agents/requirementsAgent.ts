import { callWithFallback, addBuildLog, updateProject } from '@/lib';
import { z } from 'zod';

const RequirementsOutput = z.object({
  appName: z.string(),
  description: z.string(),
  targetUsers: z.string(),
  coreFeatures: z.array(z.string()),
  techPreferences: z.object({
    framework: z.string().optional(),
    styling: z.string().optional(),
    database: z.string().optional(),
    auth: z.string().optional(),
  }).optional(),
  pages: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
  })),
  integrations: z.array(z.string()).optional(),
});

export async function requirementsAgent(
  projectId: string,
  userPrompt: string
): Promise<z.infer<typeof RequirementsOutput>> {
  await addBuildLog(projectId, 'requirements', 'Analyzing requirements...', 'info');
  await updateProject(projectId, { current_step: 'requirements', progress: 10 });

  const systemPrompt = `You are a senior product manager and technical analyst. Your task is to deeply analyze user app ideas and produce structured requirements documents.

Extract the following:
1. App name (suggest if not provided)
2. Description (what the app does, key value proposition)
3. Target users (who will use this)
4. Core features (list of functional requirements)
5. Tech preferences (if mentioned - framework, styling, database, auth)
6. Pages/routes needed (suggest based on features)
7. Integrations (APIs, third-party services needed)

Respond ONLY with a valid JSON object matching the required schema. Do not include markdown code blocks.`;

  const { content, modelUsed } = await callWithFallback(
    'code',
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    0.3
  );

  await addBuildLog(projectId, 'requirements', `Requirements extracted using ${modelUsed}`, 'info');

  try {
    const parsed = JSON.parse(content);
    const result = RequirementsOutput.parse(parsed);
    await addBuildLog(projectId, 'requirements', `Identified ${result.coreFeatures.length} features, ${result.pages.length} pages`, 'info');
    return result;
  } catch (err) {
    await addBuildLog(projectId, 'requirements', `Failed to parse requirements: ${err}`, 'error');
    throw err;
  }
}
