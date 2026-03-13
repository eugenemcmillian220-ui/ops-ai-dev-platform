import { callWithFallback, addBuildLog, updateProject } from '@/lib';

export async function codeAgent(
  projectId: string,
  fileStructure: { name: string; type: string; path: string; description: string }[],
  architecture: { techStack: Record<string, string> }
): Promise<Record<string, string>> {
  await addBuildLog(projectId, 'code', 'Generating codebase...', 'info');
  await updateProject(projectId, { current_step: 'code', progress: 50 });

  const systemPrompt = `You are a senior full-stack developer. Write production-quality TypeScript code.

Strict requirements:
- TypeScript strict mode compatible (no 'any' types)
- Use proper error handling with try/catch
- Include JSDoc comments for complex functions
- Follow the project's file structure exactly
- Use the specified tech stack
- All imports must be valid
- No placeholder code - implement fully

Output format: JSON object with file paths as keys and complete code as values.`;

  const generatedCode: Record<string, string> = {};

  // Generate files in batches of 5 for efficiency
  const batches = chunkArray(fileStructure, 5);

  for (const batch of batches) {
    const fileList = batch.map(f => `- ${f.path}: ${f.description}`).join('\n');
    
    const prompt = `Generate code for these files:
${fileList}

Tech Stack: ${JSON.stringify(architecture.techStack)}

For each file, provide the complete implementation. Return as JSON with file paths as keys.`;

    const { content, modelUsed } = await callWithFallback(
      'code',
      systemPrompt,
      [{ role: 'user', content: prompt }],
      0.2
    );

    try {
      const parsed = JSON.parse(content);
      Object.assign(generatedCode, parsed);
      await addBuildLog(projectId, 'code', `Generated ${batch.length} files with ${modelUsed}`, 'info');
    } catch (err) {
      await addBuildLog(projectId, 'code', `Parse error for batch: ${err}`, 'error');
    }
  }

  await updateProject(projectId, { progress: 60 });
  return generatedCode;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
