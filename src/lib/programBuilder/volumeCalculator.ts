/**
 * Volume Calculator
 * Calculates weekly and per-session volume based on experience level and split
 */

import type { ExperienceLevel, MuscleGroup, SplitDefinition, UserProfile, VolumeAllocation } from './types';

/**
 * Get weekly volume range (sets per muscle per week) based on experience level
 */
function getWeeklyVolumeRange(experience: ExperienceLevel): [number, number] {
  switch (experience) {
    case 'never':
    case 'beginner':
      return [6, 12]; // 6-12 sets per muscle per week
    case 'intermediate':
      return [5, 10]; // 5-10 sets per muscle per week
    case 'advanced':
      return [3, 9]; // 3-9 sets per muscle per week
    default:
      return [6, 12];
  }
}

/**
 * Get per-session set limits based on training frequency
 */
function getPerSessionSetLimits(frequencyPerWeek: number): [number, number] {
  if (frequencyPerWeek >= 3) {
    return [1, 4]; // 1-4 sets per muscle when training 3x per week
  } else if (frequencyPerWeek === 2) {
    return [2, 5]; // 2-5 sets per muscle when training 2x per week
  } else {
    return [3, 9]; // 3-9 sets per muscle when training 1x per week
  }
}

/**
 * Calculate volume allocation for all muscles in the program
 */
export function calculateVolume(profile: UserProfile, split: SplitDefinition): VolumeAllocation {
  const volume: VolumeAllocation = {};

  // Get volume range for this experience level
  const [minWeekly, maxWeekly] = getWeeklyVolumeRange(profile.experience);

  // Calculate how many times per week each muscle is trained
  const muscleFrequency: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    shoulders: 0,
    triceps: 0,
    biceps: 0,
    quads: 0,
    hamstrings: 0,
    glutes: 0,
    calves: 0,
    core: 0,
    forearms: 0,
  };

  // Count frequency for each muscle
  for (const day of split.weekStructure) {
    for (const muscle of day.targetMuscles) {
      muscleFrequency[muscle]++;
    }
  }

  // Calculate sets per muscle
  for (const muscle of Object.keys(muscleFrequency) as MuscleGroup[]) {
    const frequency = muscleFrequency[muscle];

    if (frequency === 0) {
      // Muscle not trained
      continue;
    }

    // Choose weekly volume (middle of range by default)
    const targetWeeklyVolume = Math.round((minWeekly + maxWeekly) / 2);

    // Get per-session limits for this frequency
    const [minPerSession, maxPerSession] = getPerSessionSetLimits(frequency);

    // Calculate sets per session
    let setsPerSession = Math.round(targetWeeklyVolume / frequency);

    // Ensure within per-session limits
    setsPerSession = Math.max(minPerSession, Math.min(maxPerSession, setsPerSession));

    // Verify weekly total doesn't exceed limits
    const calculatedWeekly = setsPerSession * frequency;

    volume[muscle] = {
      weekly: Math.min(calculatedWeekly, maxWeekly),
      perSession: setsPerSession,
    };
  }

  // Account for time constraint (roughly 4 minutes per set including rest)
  if (profile.minutesPerSession > 0) {
    adjustForTimeConstraint(volume, profile.minutesPerSession);
  }

  return volume;
}

/**
 * Adjust volume if time constraint is limiting
 */
function adjustForTimeConstraint(volume: VolumeAllocation, minutesPerSession: number): void {
  // Rough estimate: 4 minutes per set (including rest, exercise time, etc.)
  const minPerSet = 4;
  const maxSetsPerSession = Math.floor(minutesPerSession / minPerSet);

  if (maxSetsPerSession < 5) {
    // Time is very constrained - reduce per-session sets proportionally
    for (const muscle of Object.keys(volume) as MuscleGroup[]) {
      const current = volume[muscle];
      if (current && current.perSession > maxSetsPerSession) {
        current.perSession = Math.max(1, maxSetsPerSession);
      }
    }
  }
}
