/**
 * Exercise Selector
 * Selects appropriate exercises for a training day based on user profile and volume
 */

import type { ExerciseSlot, MuscleGroup, TrainingDay, UserProfile, VolumeAllocation } from './types';
import { EXERCISE_CATALOG } from './exerciseCatalog';
import { getRepRange } from './repRangeAssigner';

/**
 * Select exercises for a specific training day
 */
export function selectExercises(
  day: TrainingDay,
  profile: UserProfile,
  volume: VolumeAllocation,
): ExerciseSlot[] {
  const slots: ExerciseSlot[] = [];
  let orderPriority = 1;

  // Determine if we need to prioritize weak points
  const hasWeakPoints = profile.experience === 'advanced' && profile.weakPoints && profile.weakPoints.length > 0;

  // First, if advanced with weak points: add weak-point focused exercises
  if (hasWeakPoints) {
    for (const weakPoint of profile.weakPoints || []) {
      // Find exercises biased to this weak point
      const biasedExercises = EXERCISE_CATALOG.filter(
        (ex) =>
          ex.muscleBias === weakPoint &&
          day.targetMuscles.includes(ex.primaryMuscles[0]) &&
          ex.gymTypes.includes(profile.gymType) &&
          canUseExercise(ex, profile),
      );

      if (biasedExercises.length > 0) {
        const selected = biasedExercises[0];
        const slot = createExerciseSlot(
          selected,
          day.targetMuscles[0],
          biasedExercises,
          profile,
          orderPriority,
        );
        slots.push(slot);
        orderPriority++;
      }
    }
  }

  // Then, add compound exercises for target muscles
  for (const targetMuscle of day.targetMuscles) {
    // Get suitable exercises for this muscle
    const suitableExercises = EXERCISE_CATALOG.filter(
      (ex) =>
        ex.primaryMuscles.includes(targetMuscle) &&
        ex.taxingness === 'high' && // Compounds first
        canUseExercise(ex, profile),
    );

    // Distribute volume across exercises
    const volumeAlloc = volume[targetMuscle];
    if (volumeAlloc && suitableExercises.length > 0) {
      // Pick primary compound
      const primary = suitableExercises[0];
      const setCount = Math.max(1, Math.ceil(volumeAlloc.perSession * 0.5)); // ~50% of volume

      const slot = createExerciseSlot(
        primary,
        targetMuscle,
        suitableExercises,
        profile,
        orderPriority,
        setCount,
      );
      slots.push(slot);
      orderPriority++;
    }
  }

  // Finally, add isolation exercises for target muscles
  for (const targetMuscle of day.targetMuscles) {
    const volumeAlloc = volume[targetMuscle];

    const isolationExercises = EXERCISE_CATALOG.filter(
      (ex) =>
        ex.primaryMuscles.includes(targetMuscle) &&
        ex.taxingness !== 'high' &&
        canUseExercise(ex, profile),
    );

    if (volumeAlloc && isolationExercises.length > 0) {
      // Pick isolation exercise
      const isolation = isolationExercises[0];
      const setCount = Math.max(1, Math.ceil(volumeAlloc.perSession * 0.5)); // ~50% of volume

      const slot = createExerciseSlot(
        isolation,
        targetMuscle,
        isolationExercises,
        profile,
        orderPriority,
        setCount,
      );
      slots.push(slot);
      orderPriority++;
    }
  }

  return slots;
}

/**
 * Check if exercise can be used (gym type + experience compatible)
 */
function canUseExercise(exercise: any, profile: UserProfile): boolean {
  const hasGymType = exercise.gymTypes.includes(profile.gymType);
  const meetsExperience = isExperienceGreaterOrEqual(profile.experience, exercise.experienceMin);
  return hasGymType && meetsExperience;
}

/**
 * Check if user experience level meets exercise requirement
 */
function isExperienceGreaterOrEqual(userExp: string, requiredExp: string): boolean {
  const levels = ['never', 'beginner', 'intermediate', 'advanced'];
  const userLevel = levels.indexOf(userExp);
  const requiredLevel = levels.indexOf(requiredExp);
  return userLevel >= requiredLevel;
}

/**
 * Create an exercise slot with alternatives
 */
function createExerciseSlot(
  selected: any,
  targetMuscle: MuscleGroup,
  alternatives: any[],
  profile: UserProfile,
  orderPriority: number,
  setCount: number = 3,
): ExerciseSlot {
  // Get alternatives (same movement pattern)
  const alternativeList = alternatives
    .filter((ex) => ex.id !== selected.id)
    .slice(0, 3); // Up to 3 alternatives

  return {
    id: `${selected.id}-${orderPriority}`,
    selectedExercise: selected,
    alternatives: alternativeList,
    sets: setCount,
    repRange: getRepRange(selected, profile.experience),
    targetMuscle,
    movementPattern: selected.movementPattern,
    orderPriority,
  };
}
