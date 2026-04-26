/**
 * Agent Tool: getExerciseInfo
 *
 * Looks up an exercise from the catalog by name (exact or fuzzy).
 * Returns structured info the LLM can reference when coaching.
 */

import {
  EXERCISE_CATALOG,
  getExerciseById,
} from '@/lib/programBuilder/exerciseCatalog';
import type { CatalogExercise } from '@/lib/programBuilder/types';

/** Search the catalog by name (case-insensitive substring match). */
function findExercise(query: string): CatalogExercise | undefined {
  const q = query.toLowerCase().trim();

  // 1. Exact ID match
  const byId = getExerciseById(q);
  if (byId) return byId;

  // 2. Exact name match (case-insensitive)
  const exact = EXERCISE_CATALOG.find(
    (e) => e.name.toLowerCase() === q,
  );
  if (exact) return exact;

  // 3. Substring match — prefer shortest name that contains the query
  const matches = EXERCISE_CATALOG.filter((e) =>
    e.name.toLowerCase().includes(q),
  ).sort((a, b) => a.name.length - b.name.length);

  return matches[0] ?? undefined;
}

function formatExercise(e: CatalogExercise): string {
  const lines: string[] = [
    `**${e.name}** (${e.id})`,
    `Movement pattern: ${e.movementPattern.replace(/_/g, ' ')}`,
    `Primary muscles: ${e.primaryMuscles.join(', ')}`,
  ];

  if (e.secondaryMuscles?.length) {
    lines.push(`Secondary muscles: ${e.secondaryMuscles.join(', ')}`);
  }
  if (e.muscleBias) {
    lines.push(`Muscle bias: ${e.muscleBias.replace(/_/g, ' ')}`);
  }
  if (e.lengthTension) {
    lines.push(`Length-tension emphasis: ${e.lengthTension}`);
  }

  lines.push(`Equipment: ${e.equipment.join(', ')}`);
  lines.push(`Gym types: ${e.gymTypes.join(', ')}`);
  lines.push(`Taxingness: ${e.taxingness}`);
  lines.push(`Minimum experience: ${e.experienceMin}`);

  if (e.techniqueCues.length > 0) {
    lines.push(`Technique cues:`);
    e.techniqueCues.forEach((cue) => lines.push(`  - ${cue}`));
  }

  return lines.join('\n');
}

export async function getExerciseInfo(
  args: { exerciseName: string },
): Promise<string> {
  const exercise = findExercise(args.exerciseName);

  if (!exercise) {
    // Return a list of close matches to help the LLM retry
    const q = args.exerciseName.toLowerCase();
    const suggestions = EXERCISE_CATALOG.filter(
      (e) =>
        e.name.toLowerCase().includes(q.split(' ')[0]) ||
        e.primaryMuscles.some((m) => q.includes(m)),
    )
      .slice(0, 5)
      .map((e) => e.name);

    if (suggestions.length > 0) {
      return `No exact match for "${args.exerciseName}". Did you mean one of: ${suggestions.join(', ')}?`;
    }
    return `No exercise found matching "${args.exerciseName}" in the catalog.`;
  }

  return formatExercise(exercise);
}
