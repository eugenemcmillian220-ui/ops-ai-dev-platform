import { callWithFallback, addBuildLog, updateProject } from '@/lib';
import { z } from 'zod';

const Component = z.object({
  name: z.string(),
  type: z.enum(['page', 'component', 'hook', 'api', 'lib']),
  path: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).optional(),
});

const ArchitectureOutput = z.object({
  techStack: z.object({
    framework: z.string(),
    language: z.string(),
    styling: z.string(),
    stateManagement: z.string(),
    dataFetching: z.string(),
    auth: z.string(),
    deployment: z.string(),
  }),
  fileStructure: z.array(Component),
  apiRoutes: z.array(z.object({
    path: z.string(),
    method: z.string(),
    purpose: z.string(),
  })).optional(),
  envVars: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    required: z.boolean(),
  })).optional(),
});

export async function architectureAgent(
  projectId: string,
  requirements: { appName: string; coreFeatures: string[]; techPreferences?: Record<string, string> }
): Promise<z.infer<typeof ArchitectureOutput>> {
  await addBuildLog(projectId, 'architecture', 'Designing system architecture...', 'info');
  await updateProject(projectId, { current_step: 'architecture', progress: 30 });

  const systemPrompt = `You are a principal software architect. Design the complete technical architecture for this application.

Output structure must include:
1. Tech stack selections with rationale
2. Complete file structure with all components, pages, hooks, and API routes
3. API endpoint design
4. Required environment variables

Use Next.js 15, React 19, TypeScript (strict), Tailwind CSS, and Supabase by default unless user specified otherwise.

Respond ONLY with valid JSON matching the required schema. No markdown code blocks.`;

  const prompt = `Design architecture for: ${requirements.appName}

Features: ${requirements.coreFeatures.join(', ')}
Tech Preferences: ${JSON.stringify(requirements.techPreferences || {})}

Create a complete file structure and tech stack.`;

  const { content, modelUsed } = await callWithFallback(
    'code',
    systemPrompt,
    [{ role: 'user', content: prompt }],
    0.2
  );

  await addBuildLog(projectId, 'architecture', `Architecture designed using ${modelUsed}`, 'info');

  try {
    const parsed = JSON.parse(content);
    const result = ArchitectureOutput.parse(parsed);
    await addBuildLog(projectId, 'architecture', `Defined ${result.fileStructure.length} files`, 'info');
    return result;
  } catch (err) {
    await addBuildLog(projectId, 'architecture', `Failed to parse architecture: ${err}`, 'error');
    throw err;
  }
}
