/**
 * Program Builder
 * Main entry point for the program builder foundation module
 */

// Re-export all types
export type {
  CatalogExercise,
  ExerciseSlot,
  ExperienceLevel,
  GeneratedProgram,
  GymType,
  LengthTension,
  MovementPattern,
  MuscleBias,
  MuscleGroup,
  SplitDefinition,
  SplitType,
  Taxingness,
  TrainingDay,
  UserProfile,
  VolumeAllocation,
  VolumeAllocationPerMuscle,
  WorkoutDay,
} from './types';

// Re-export exercise catalog and helpers
export { EXERCISE_CATALOG, getExerciseById, getExercisesByMuscle, getExercisesByPattern, getExercisesForGym } from './exerciseCatalog';

// Re-export split recommender
export { getRecommendedSplits } from './splitRecommender';

// Re-export volume calculator
export { calculateVolume } from './volumeCalculator';

// Re-export rep range assigner
export { getRepRange } from './repRangeAssigner';

// Re-export exercise selector
export { selectExercises } from './exerciseSelector';

// Re-export program assembler
export { generateProgram } from './programAssembler';
