import { callWithFallback, addBuildLog, updateProject, supabaseAdmin, refundCredits } from '@/lib';
import { z } from 'zod';

const Diagnosis = z.object({
  issue: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedFiles: z.array(z.string()),
  fix: z.string(),
});

export async function selfHealer(
  projectId: string,
  userId: string,
  errorLog: string
): Promise<{ success: boolean; fixed?: boolean; refund?: boolean }> {
  await addBuildLog(projectId, 'healer', 'Analyzing build failure...', 'warn');
  await updateProject(projectId, { current_step: 'healing', status: 'failed' });

  const systemPrompt = `You are an expert debugging agent. Analyze build/deployment logs and diagnose the root cause.

Output JSON with:
- issue: concise description of the problem
- severity: low, medium, high, critical
- affectedFiles: array of file paths that need changes
- fix: step-by-step instructions to resolve

Be specific. Identify exact file paths and line numbers if possible.`;

  try {
    const { content, modelUsed } = await callWithFallback(
      'reasoning',
      systemPrompt,
      [{ role: 'user', content: `Build log:\n${errorLog}` }],
      0.2
    );

    await addBuildLog(projectId, 'healer', `Diagnosed using ${modelUsed}`, 'info');

    const parsed = JSON.parse(content);
    const diagnosis = Diagnosis.parse(parsed);

    await addBuildLog(projectId, 'healer', `Issue: ${diagnosis.issue}`, diagnosis.severity === 'critical' ? 'error' : 'warn');
    await addBuildLog(projectId, 'healer', `Affected: ${diagnosis.affectedFiles.join(', ')}`, 'info');

    // If critical, refund and escalate
    if (diagnosis.severity === 'critical') {
      await refundCredits(userId, projectId, 1);
      await addBuildLog(projectId, 'healer', 'Credits refunded due to critical failure', 'info');
      await updateProject(projectId, { 
        status: 'failed',
        current_step: 'failed_critical'
      });
      return { success: false, fixed: false, refund: true };
    }

    // Attempt auto-fix
    if (diagnosis.affectedFiles.length > 0) {
      await addBuildLog(projectId, 'healer', `Attempting auto-fix...`, 'info');
      
      const fixPrompt = `Fix this code issue:
${diagnosis.fix}

Apply fix to files: ${diagnosis.affectedFiles.join(', ')}

Return the corrected code as JSON: { "filepath": "corrected_code" }`;

      const { content: fixContent } = await callWithFallback(
        'code',
        systemPrompt,
        [{ role: 'user', content: fixPrompt }],
        0.2
      );

      // Store fix suggestions
      await supabaseAdmin
        .from('projects')
        .update({
          encrypted_secrets: JSON.stringify({
            healer_diagnosis: diagnosis,
            suggested_fixes: fixContent,
            detected_at: new Date().toISOString(),
          }),
        })
        .eq('id', projectId);

      await updateProject(projectId, { 
        status: 'failed',
        current_step: 'needs_manual_fix'
      });
      await addBuildLog(projectId, 'healer', 'Fix suggestions saved. Manual intervention required.', 'info');
    }

    return { success: true, fixed: false };
  } catch (err) {
    await addBuildLog(projectId, 'healer', `Healer failed: ${err}`, 'error');
    return { success: false, fixed: false };
  }
}
