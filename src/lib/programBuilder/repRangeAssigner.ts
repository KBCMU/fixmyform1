/**
 * Rep Range Assigner
 * Assigns appropriate rep ranges based on exercise taxingness and user experience
 */

import type { CatalogExercise, ExperienceLevel } from './types';

/**
 * Get rep range for an exercise based on its taxingness and user experience level
 */
export function getRepRange(
  exercise: CatalogExercise,
  experience: ExperienceLevel,
): [number, number] {
  const { taxingness } = exercise;

  if (taxingness === 'high') {
    // Heavy compounds: always 4-6 reps
    return [4, 6];
  }

  if (taxingness === 'low') {
    // Light/isolation exercises: always 10-15 reps
    return [10, 15];
  }

  // Moderate taxingness: varies by experience
  switch (experience) {
    case 'never':
    case 'beginner':
      return [8, 12];
    case 'intermediate':
      return [6, 10];
    case 'advanced':
      return [5, 8];
    default:
      return [8, 12];
  }
}
