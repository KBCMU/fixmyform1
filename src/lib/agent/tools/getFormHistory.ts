/**
 * Agent Tool: getFormHistory
 *
 * Fetches the user's recent form analysis history from form_evaluations.
 * Returns a formatted summary the LLM can reference.
 */

import { createClient } from '@/lib/supabase/server';

interface EvaluationResult {
  overallScore?: number;
  formScore?: number;
  issues?: Array<{
    name?: string;
    aspect?: string;
    description?: string;
    severity?: string;
  }>;
  positives?: Array<{
    aspect?: string;
    description?: string;
  }>;
  validReps?: number;
  totalReps?: number;
}

interface FormEvaluationRow {
  id: string;
  exercise_name: string;
  evaluation_result: EvaluationResult;
  created_at: string;
}

function formatEvaluation(row: FormEvaluationRow, index: number): string {
  const e = row.evaluation_result;
  const score = e.overallScore ?? e.formScore ?? 0;
  const date = new Date(row.created_at).toLocaleDateString();

  const lines: string[] = [
    `**${index + 1}. ${row.exercise_name}** — Score: ${Math.round(score)}/100 (${date})`,
  ];

  if (e.validReps !== undefined || e.totalReps !== undefined) {
    lines.push(`   Reps: ${e.validReps ?? '?'}/${e.totalReps ?? '?'}`);
  }

  if (e.issues && e.issues.length > 0) {
    const issueTexts = e.issues
      .slice(0, 3)
      .map((i) => {
        const name = i.name ?? i.aspect ?? 'Issue';
        const severity = i.severity ? ` (${i.severity})` : '';
        return `${name}${severity}`;
      });
    lines.push(`   Issues: ${issueTexts.join('; ')}`);
  }

  if (e.positives && e.positives.length > 0) {
    const posTexts = e.positives
      .slice(0, 2)
      .map((p) => p.description ?? p.aspect ?? 'Good');
    lines.push(`   Positives: ${posTexts.join('; ')}`);
  }

  return lines.join('\n');
}

export async function getFormHistory(
  args: { limit?: number },
  userId: string,
): Promise<string> {
  const limit = Math.min(args.limit ?? 5, 10);
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('form_evaluations')
    .select('id, exercise_name, evaluation_result, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return 'Unable to fetch form history at this time.';
  }

  const rows = (data ?? []) as FormEvaluationRow[];

  if (rows.length === 0) {
    return 'The user has no form analyses yet. Suggest they upload a video on the Analyze page to get started.';
  }

  const header = `**Recent Form Analyses (${rows.length}):**\n`;
  const entries = rows.map((row, i) => formatEvaluation(row, i)).join('\n\n');

  return header + entries;
}
