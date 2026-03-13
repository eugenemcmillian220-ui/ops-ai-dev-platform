import { callWithFallback, addBuildLog, updateProject } from '@/lib';

export async function uiAgent(
  projectId: string,
  pages: { name: string; purpose: string }[],
  techStack: { styling: string }
): Promise<Record<string, string>> {
  await addBuildLog(projectId, 'ui', 'Designing UI components...', 'info');
  await updateProject(projectId, { current_step: 'ui', progress: 40 });

  const systemPrompt = `You are a UI/UX developer specializing in React + Tailwind CSS. Generate complete page components.

Rules:
- Use Tailwind CSS for all styling (no inline styles)
- Mobile-first responsive design
- Buttons must be min 48px height
- Use semantic HTML
- Include loading and error states
- Make components fully self-contained with mock data where needed

Output format: JSON object with page names as keys and complete component code as values. Code must be valid TypeScript/React. No markdown in code values.`;

  const generatedPages: Record<string, string> = {};

  for (const page of pages) {
    const prompt = `Generate the complete React component for page: ${page.name}

Purpose: ${page.purpose}
Styling: ${techStack.styling || 'Tailwind CSS'}

Include:
- All imports
- TypeScript interfaces
- Full component implementation
- Mock data for demo
- Responsive design

Return ONLY the code as a string value in JSON.`;

    const { content, modelUsed } = await callWithFallback(
      'code',
      systemPrompt,
      [{ role: 'user', content: prompt }],
      0.3
    );

    // Extract code from JSON or raw response
    let code = content;
    try {
      const parsed = JSON.parse(content);
      code = parsed.code || parsed[page.name] || parsed.component || content;
    } catch {
      // Not JSON, use raw content
    }

    generatedPages[page.name] = code;
    await addBuildLog(projectId, 'ui', `Generated ${page.name} page with ${modelUsed}`, 'info');
  }

  await addBuildLog(projectId, 'ui', `Completed ${Object.keys(generatedPages).length} pages`, 'info');
  return generatedPages;
}
