import { callWithFallback, addBuildLog, updateProject } from '@/lib';
import { z } from 'zod';

const Table = z.object({
  name: z.string(),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
    nullable: z.boolean().default(false),
    default: z.string().optional(),
    references: z.string().optional(),
  })),
  indexes: z.array(z.string()).optional(),
});

const SchemaOutput = z.object({
  tables: z.array(Table),
  enums: z.array(z.object({
    name: z.string(),
    values: z.array(z.string()),
  })).optional(),
  rlsPolicies: z.array(z.object({
    table: z.string(),
    action: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
    using: z.string(),
    withCheck: z.string().optional(),
  })).optional(),
});

export async function schemaAgent(
  projectId: string,
  requirements: { appName: string; coreFeatures: string[]; pages: { name: string; purpose: string }[] }
): Promise<z.infer<typeof SchemaOutput>> {
  await addBuildLog(projectId, 'schema', 'Designing database schema...', 'info');
  await updateProject(projectId, { current_step: 'schema', progress: 20 });

  const systemPrompt = `You are a database architect specializing in Supabase/PostgreSQL. Design a normalized database schema for the described application.

For each table:
- Include created_at and updated_at timestamps
- Use UUID primary keys with gen_random_uuid() default
- Add foreign key references where appropriate
- Include indexes for performance
- Follow naming conventions: snake_case for tables/columns

Include RLS policies for user data isolation.

Respond ONLY with valid JSON matching the required schema. No markdown code blocks.`;

  const prompt = `Design a database schema for: ${requirements.appName}

Features: ${requirements.coreFeatures.join(', ')}
Pages: ${requirements.pages.map(p => p.name).join(', ')}

Generate tables needed to support all features.`;

  const { content, modelUsed } = await callWithFallback(
    'code',
    systemPrompt,
    [{ role: 'user', content: prompt }],
    0.2
  );

  await addBuildLog(projectId, 'schema', `Schema designed using ${modelUsed}`, 'info');

  try {
    const parsed = JSON.parse(content);
    const result = SchemaOutput.parse(parsed);
    await addBuildLog(projectId, 'schema', `Created ${result.tables.length} tables`, 'info');
    return result;
  } catch (err) {
    await addBuildLog(projectId, 'schema', `Failed to parse schema: ${err}`, 'error');
    throw err;
  }
}
