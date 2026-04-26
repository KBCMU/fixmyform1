/**
 * Agent Tool: getUserProgram
 *
 * Fetches the user's latest training program from the user_programs table.
 * Returns a formatted text summary the LLM can reference.
 */

import { createClient } from '@/lib/supabase/server';

interface ProgramData {
  splitType?: string;
  totalDays?: number;
  workouts?: Array<{
    dayName?: string;
    focus?: string;
    exercises?: Array<{
      name?: string;
      sets?: number;
      repRange?: string;
      restSeconds?: number;
      notes?: string;
    }>;
  }>;
}

interface UserProgramRow {
  id: string;
  name: string;
  program_data: ProgramData;
  llm_explanation: string | null;
  created_at: string;
}

function formatProgram(row: UserProgramRow): string {
  const p = row.program_data;
  const lines: string[] = [
    `**Program:** ${row.name}`,
    `**Split:** ${p.splitType?.replace(/_/g, ' ') ?? 'Unknown'}`,
    `**Days/week:** ${p.totalDays ?? 'Unknown'}`,
    `**Created:** ${new Date(row.created_at).toLocaleDateString()}`,
    '',
  ];

  if (p.workouts && p.workouts.length > 0) {
    for (const workout of p.workouts) {
      lines.push(`### ${workout.dayName ?? 'Workout'} — ${workout.focus ?? ''}`);
      if (workout.exercises && workout.exercises.length > 0) {
        for (const ex of workout.exercises) {
          const sets = ex.sets ? `${ex.sets} sets` : '';
          const reps = ex.repRange ? ` x ${ex.repRange}` : '';
          const rest = ex.restSeconds ? ` (${ex.restSeconds}s rest)` : '';
          lines.push(`  - ${ex.name ?? 'Exercise'}${sets ? ': ' + sets : ''}${reps}${rest}`);
          if (ex.notes) lines.push(`    Note: ${ex.notes}`);
        }
      } else {
        lines.push('  (No exercises listed)');
      }
      lines.push('');
    }
  }

  if (row.llm_explanation) {
    lines.push(`**Rationale:** ${row.llm_explanation}`);
  }

  return lines.join('\n');
}

export async function getUserProgram(
  _args: Record<string, never>,
  userId: string,
): Promise<string> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_programs')
    .select('id, name, program_data, llm_explanation, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 'The user does not have a training program saved yet. You can suggest they create one using the Program Builder feature.';
  }

  return formatProgram(data as UserProgramRow);
}
