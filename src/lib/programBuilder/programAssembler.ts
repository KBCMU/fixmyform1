/**
 * Program Assembler
 * Orchestrates all modules to generate a complete training program
 */

import type { GeneratedProgram, UserProfile } from './types';
import { calculateVolume } from './volumeCalculator';
import { selectExercises } from './exerciseSelector';
import { getRecommendedSplits } from './splitRecommender';

/**
 * Generate a complete training program from a user profile
 */
export function generateProgram(profile: UserProfile): GeneratedProgram {
  // 1. Get the selected split definition
  const availableSplits = getRecommendedSplits(profile.daysPerWeek);
  const split = availableSplits.find((s) => s.type === profile.selectedSplit);

  if (!split) {
    throw new Error(`Split type '${profile.selectedSplit}' not available for ${profile.daysPerWeek} days per week`);
  }

  // 2. Calculate volume allocation for all muscles
  const volumeAllocation = calculateVolume(profile, split);

  // 3. For each day in the split, select exercises
  const workouts = split.weekStructure.map((day, index) => {
    // Skip rest days (empty targetMuscles)
    if (day.targetMuscles.length === 0) {
      return {
        dayName: `Day ${index + 1} - ${day.name}`,
        exercises: [],
      };
    }

    // Select exercises for this training day
    const exercises = selectExercises(day, profile, volumeAllocation);

    // Sort by order priority
    exercises.sort((a, b) => a.orderPriority - b.orderPriority);

    return {
      dayName: `Day ${index + 1} - ${day.name}`,
      exercises,
    };
  });

  // 4. Assemble into GeneratedProgram
  return {
    profile,
    split,
    workouts,
    createdAt: new Date().toISOString(),
  };
}
