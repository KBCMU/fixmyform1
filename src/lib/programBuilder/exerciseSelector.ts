/**
 * Exercise Selector
 * Selects appropriate exercises for a training day based on user profile and volume
 */

import { EXERCISE_CATALOG } from './exerciseCatalog';
import { getRepRange } from './repRangeAssigner';
import type {
  CatalogExercise,
  ExperienceLevel,
  ExerciseSlot,
  MovementPattern,
  MuscleGroup,
  TrainingDay,
  UserProfile,
  VolumeAllocation,
} from './types';

const COMPOUND_PATTERNS: MovementPattern[] = [
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'hip_hinge',
  'squat',
  'lunge',
];

/**
 * Select exercises for a specific training day
 */
export function selectExercises(
  day: TrainingDay,
  profile: UserProfile,
  volume: VolumeAllocation,
): ExerciseSlot[] {
  const slots: ExerciseSlot[] = [];
  const usedExerciseIds = new Set<string>();
  const muscleCoverage = createMuscleCoverageMap();
  let orderPriority = 1;

  const maxExercises = getMaxExercises(profile);
  const targetExerciseCount = getTargetExerciseCount(day.targetMuscles.length, maxExercises);

  if (day.targetMuscles.length === 0 || maxExercises <= 0) {
    return slots;
  }

  const targetMuscleSet = new Set(day.targetMuscles);
  const dayCandidates = EXERCISE_CATALOG.filter(
    (exercise) => canUseExercise(exercise, profile) && exercise.primaryMuscles.some((m) => targetMuscleSet.has(m)),
  );

  const hasWeakPoints = profile.experience === 'advanced' && Boolean(profile.weakPoints?.length);

  // 1) Advanced weak-point prioritization.
  if (hasWeakPoints) {
    for (const weakPoint of profile.weakPoints || []) {
      if (slots.length >= maxExercises) {
        break;
      }

      const weakPointCandidates = dayCandidates.filter(
        (exercise) =>
          !usedExerciseIds.has(exercise.id)
          && exercise.muscleBias === weakPoint
          && exercise.primaryMuscles.some((muscle) => targetMuscleSet.has(muscle)),
      );

      const selected = pickFirst(weakPointCandidates);
      if (!selected) {
        continue;
      }

      const targetMuscle = selected.primaryMuscles[0];
      const setCount = getSetCount(volume, targetMuscle, 0.65);

      addExerciseSlot({
        slots,
        selected,
        targetMuscle,
        profile,
        orderPriority,
        setCount,
        dayCandidates,
        usedExerciseIds,
        muscleCoverage,
      });
      orderPriority++;
    }
  }

  // 2) Add compounds first (based on movement pattern, not taxingness).
  const desiredCompoundCount = getDesiredCompoundCount(day.targetMuscles.length, targetExerciseCount);
  while (slots.length < maxExercises && countCompounds(slots) < desiredCompoundCount) {
    const compounds = dayCandidates.filter(
      (exercise) => !usedExerciseIds.has(exercise.id) && isCompound(exercise),
    );

    const selected = pickBestExercise(compounds, muscleCoverage, volume, targetMuscleSet);
    if (!selected) {
      break;
    }

    const targetMuscle = pickPrimaryTargetMuscle(selected, day.targetMuscles, muscleCoverage, volume);
    const setCount = getSetCount(volume, targetMuscle, 0.75);

    addExerciseSlot({
      slots,
      selected,
      targetMuscle,
      profile,
      orderPriority,
      setCount,
      dayCandidates,
      usedExerciseIds,
      muscleCoverage,
    });
    orderPriority++;
  }

  // 3) Fill with isolations to close coverage gaps.
  let safety = 0;
  while (slots.length < targetExerciseCount && safety < 50) {
    safety++;

    const deficitMuscles = [...day.targetMuscles].sort(
      (a, b) => getCoverageDeficit(b, muscleCoverage, volume) - getCoverageDeficit(a, muscleCoverage, volume),
    );

    let addedInPass = false;

    for (const targetMuscle of deficitMuscles) {
      if (slots.length >= targetExerciseCount) {
        break;
      }

      const isolations = dayCandidates.filter(
        (exercise) =>
          !usedExerciseIds.has(exercise.id)
          && !isCompound(exercise)
          && exercise.primaryMuscles.includes(targetMuscle),
      );

      let selected = pickFirst(isolations);

      // fallback to any remaining movement for the target if no isolation is available.
      if (!selected) {
        const fallback = dayCandidates.filter(
          (exercise) => !usedExerciseIds.has(exercise.id) && exercise.primaryMuscles.includes(targetMuscle),
        );
        selected = pickFirst(fallback);
      }

      if (!selected) {
        continue;
      }

      const setCount = getSetCount(volume, targetMuscle, 0.5);

      addExerciseSlot({
        slots,
        selected,
        targetMuscle,
        profile,
        orderPriority,
        setCount,
        dayCandidates,
        usedExerciseIds,
        muscleCoverage,
      });
      orderPriority++;
      addedInPass = true;
    }

    if (!addedInPass) {
      break;
    }
  }

  // 4) Final fill to reach practical session size.
  while (slots.length < targetExerciseCount) {
    const fallback = dayCandidates.filter((exercise) => !usedExerciseIds.has(exercise.id));
    const selected = pickBestExercise(fallback, muscleCoverage, volume, targetMuscleSet);

    if (!selected) {
      break;
    }

    const targetMuscle = pickPrimaryTargetMuscle(selected, day.targetMuscles, muscleCoverage, volume);
    const setCount = getSetCount(volume, targetMuscle, 0.5);

    addExerciseSlot({
      slots,
      selected,
      targetMuscle,
      profile,
      orderPriority,
      setCount,
      dayCandidates,
      usedExerciseIds,
      muscleCoverage,
    });
    orderPriority++;
  }

  return slots.slice(0, maxExercises);
}

function createMuscleCoverageMap(): Record<MuscleGroup, number> {
  return {
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
    traps: 0,
    adductors: 0,
    abductors: 0,
  };
}

function countCompounds(slots: ExerciseSlot[]): number {
  return slots.filter((slot) => isCompound(slot.selectedExercise)).length;
}

function getMaxExercises(profile: UserProfile): number {
  const minutesPerSet = profile.gymType === 'home' ? 4 : 3;
  const estimated = Math.floor(profile.minutesPerSession / (3 * minutesPerSet));
  return clamp(estimated, 4, 10);
}

function getTargetExerciseCount(muscleCount: number, maxExercises: number): number {
  const base = muscleCount >= 9 ? 7 : muscleCount >= 6 ? 6 : 5;
  return Math.min(maxExercises, base);
}

function getDesiredCompoundCount(muscleCount: number, targetExerciseCount: number): number {
  const desired = muscleCount >= 9 ? 2 : muscleCount >= 6 ? 2 : 1;
  return Math.min(desired, targetExerciseCount);
}

function getSetCount(
  volume: VolumeAllocation,
  targetMuscle: MuscleGroup,
  scalingFactor: number,
): number {
  const perSession = volume[targetMuscle]?.perSession ?? 3;
  return clamp(Math.round(perSession * scalingFactor), 2, 4);
}

function getCoverageDeficit(
  muscle: MuscleGroup,
  coverage: Record<MuscleGroup, number>,
  volume: VolumeAllocation,
): number {
  const target = Math.max(2, volume[muscle]?.perSession ?? 3);
  return Math.max(0, target - coverage[muscle]);
}

function getExerciseScore(
  exercise: CatalogExercise,
  coverage: Record<MuscleGroup, number>,
  volume: VolumeAllocation,
  targetMuscles: Set<MuscleGroup>,
): number {
  const primaries = exercise.primaryMuscles.filter((m) => targetMuscles.has(m));
  const secondaries = (exercise.secondaryMuscles || []).filter((m) => targetMuscles.has(m));

  let score = 0;
  for (const muscle of primaries) {
    score += getCoverageDeficit(muscle, coverage, volume) * 3 + 2;
  }
  for (const muscle of secondaries) {
    score += getCoverageDeficit(muscle, coverage, volume) + 1;
  }

  return score;
}

function pickBestExercise(
  candidates: CatalogExercise[],
  coverage: Record<MuscleGroup, number>,
  volume: VolumeAllocation,
  targetMuscles: Set<MuscleGroup>,
): CatalogExercise | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  const sorted = [...candidates].sort((a, b) => {
    const scoreDelta = getExerciseScore(b, coverage, volume, targetMuscles)
      - getExerciseScore(a, coverage, volume, targetMuscles);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return a.id.localeCompare(b.id);
  });

  return pickFirst(sorted);
}

function pickFirst(
  candidates: CatalogExercise[],
): CatalogExercise | undefined {
  if (candidates.length === 0) {
    return undefined;
  }
  return [...candidates].sort((a, b) => a.id.localeCompare(b.id))[0];
}

function pickPrimaryTargetMuscle(
  exercise: CatalogExercise,
  dayTargetMuscles: MuscleGroup[],
  coverage: Record<MuscleGroup, number>,
  volume: VolumeAllocation,
): MuscleGroup {
  const candidates = exercise.primaryMuscles.filter((muscle) => dayTargetMuscles.includes(muscle));
  if (candidates.length === 0) {
    return dayTargetMuscles[0];
  }

  return candidates.sort(
    (a, b) => getCoverageDeficit(b, coverage, volume) - getCoverageDeficit(a, coverage, volume),
  )[0];
}

function isCompound(exercise: CatalogExercise): boolean {
  return COMPOUND_PATTERNS.includes(exercise.movementPattern);
}

function canUseExercise(exercise: CatalogExercise, profile: UserProfile): boolean {
  const hasGymType = exercise.gymTypes.includes(profile.gymType);
  const meetsExperience = isExperienceGreaterOrEqual(profile.experience, exercise.experienceMin);
  return hasGymType && meetsExperience;
}

function isExperienceGreaterOrEqual(userExp: ExperienceLevel, requiredExp: ExperienceLevel): boolean {
  const levels: ExperienceLevel[] = ['never', 'beginner', 'intermediate', 'advanced'];
  const userLevel = levels.indexOf(userExp);
  const requiredLevel = levels.indexOf(requiredExp);
  return userLevel >= requiredLevel;
}

function addExerciseSlot(params: {
  slots: ExerciseSlot[];
  selected: CatalogExercise;
  targetMuscle: MuscleGroup;
  profile: UserProfile;
  orderPriority: number;
  setCount: number;
  dayCandidates: CatalogExercise[];
  usedExerciseIds: Set<string>;
  muscleCoverage: Record<MuscleGroup, number>;
}): void {
  const {
    slots,
    selected,
    targetMuscle,
    profile,
    orderPriority,
    setCount,
    dayCandidates,
    usedExerciseIds,
    muscleCoverage,
  } = params;

  if (usedExerciseIds.has(selected.id)) {
    return;
  }

  const alternatives = dayCandidates.filter(
    (exercise) =>
      exercise.id !== selected.id
      && exercise.movementPattern === selected.movementPattern
      && !usedExerciseIds.has(exercise.id),
  );

  const slot = createExerciseSlot(
    selected,
    targetMuscle,
    alternatives,
    profile,
    orderPriority,
    setCount,
  );

  slots.push(slot);
  usedExerciseIds.add(selected.id);
  applyCoverage(muscleCoverage, selected, setCount);
}

function applyCoverage(
  coverage: Record<MuscleGroup, number>,
  exercise: CatalogExercise,
  setCount: number,
): void {
  for (const muscle of exercise.primaryMuscles) {
    coverage[muscle] += setCount;
  }

  const secondaryContribution = Math.max(1, Math.floor(setCount / 2));
  for (const muscle of exercise.secondaryMuscles || []) {
    coverage[muscle] += secondaryContribution;
  }
}

/**
 * Create an exercise slot with alternatives
 */
function createExerciseSlot(
  selected: CatalogExercise,
  targetMuscle: MuscleGroup,
  alternatives: CatalogExercise[],
  profile: UserProfile,
  orderPriority: number,
  setCount: number = 3,
): ExerciseSlot {
  const alternativeList = alternatives.slice(0, 3);

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
