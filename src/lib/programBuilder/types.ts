/**
 * Program Builder Type Definitions
 * Core interfaces for the hypertrophy program generation system
 */

/**
 * User experience level (maps to years of training)
 */
export type ExperienceLevel = 'never' | 'beginner' | 'intermediate' | 'advanced';
// Maps to: never trained / 0-1 years / 1-3 years / 3+ years

/**
 * Gym type determines equipment availability
 */
export type GymType = 'commercial' | 'home' | 'hotel';

/**
 * Movement patterns for exercise categorization
 */
export type MovementPattern =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'hip_hinge'
  | 'hip_extension'
  | 'squat'
  | 'lunge'
  | 'knee_flexion'
  | 'knee_extension'
  | 'hip_abduction'
  | 'hip_adduction'
  | 'adduction'
  | 'abduction'
  | 'shoulder_abduction'
  | 'shoulder_flexion'
  | 'elbow_flexion'
  | 'elbow_extension'
  | 'trap_row'
  | 'calf_raise'
  | 'core_flexion'
  | 'core_rotation';

/**
 * Primary muscle groups
 */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'triceps'
  | 'biceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'forearms'
  | 'traps'
  | 'adductors'
  | 'abductors';

/**
 * Muscle bias for advanced categorization (specific regions)
 */
export type MuscleBias =
  | 'chest_upper'
  | 'chest_lower'
  | 'chest_overall'
  | 'lats_upper'
  | 'lats_lower'
  | 'delts_front'
  | 'delts_lateral'
  | 'delts_rear'
  | 'triceps_long'
  | 'triceps_medial_lateral'
  | 'biceps_brachialis'
  | 'biceps_long_short';

/**
 * Length-tension relationship of exercise
 */
export type LengthTension = 'lengthened' | 'shortened' | 'mid_range';

/**
 * Equipment types available
 */
export type Equipment = 'machine' | 'cable' | 'barbell' | 'dumbbell' | 'bodyweight' | 'smith_machine' | 'band';

/**
 * How taxing/difficult an exercise is (affects rep ranges)
 */
export type Taxingness = 'high' | 'moderate' | 'low';

/**
 * A single exercise in the catalog
 */
export interface CatalogExercise {
  id: string;
  name: string;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  muscleBias?: MuscleBias;
  lengthTension?: LengthTension;
  equipment: Equipment[];
  gymTypes: GymType[]; // which gym types have this equipment
  taxingness: Taxingness;
  experienceMin: ExperienceLevel;
  techniqueCues: string[];
  referenceVideoUrl?: string;
  referenceVideoCredit?: string;
}

/**
 * Available split types
 */
export type SplitType =
  | 'full_body'
  | 'upper_lower'
  | 'anterior_posterior'
  | 'push_pull_legs'
  | 'upper_lower_ppl'; // 5-day: UL + PPL

/**
 * A training day in the split
 */
export interface TrainingDay {
  name: string; // e.g., "Upper A", "Full Body", "Push"
  targetMuscles: MuscleGroup[];
}

/**
 * A split definition
 */
export interface SplitDefinition {
  type: SplitType;
  name: string; // display name
  description: string; // brief explanation
  daysPerWeek: number;
  weekStructure: TrainingDay[]; // ordered by day
  recommended?: boolean;
}

/**
 * User profile from the wizard questionnaire
 */
export interface UserProfile {
  experience: ExperienceLevel;
  daysPerWeek: number; // 2-6
  minutesPerSession: number; // 30, 45, 60, 75, 90
  gymType: GymType;
  weakPoints?: MuscleBias[]; // only for advanced
  selectedSplit: SplitType;
}

/**
 * A single exercise slot in the generated program
 */
export interface ExerciseSlot {
  id: string; // unique slot ID
  selectedExercise: CatalogExercise;
  alternatives: CatalogExercise[]; // same movement pattern, swappable
  sets: number;
  repRange: [number, number]; // e.g., [8, 12]
  targetMuscle: MuscleGroup;
  movementPattern: MovementPattern;
  orderPriority: number; // lower = earlier in workout
}

/**
 * A single day's workout
 */
export interface WorkoutDay {
  dayName: string; // e.g., "Day 1 - Upper A"
  exercises: ExerciseSlot[];
}

/**
 * The complete generated program
 */
export interface GeneratedProgram {
  id?: string;
  profile: UserProfile;
  split: SplitDefinition;
  workouts: WorkoutDay[];
  explanation?: string; // LLM-generated rationale (added later)
  createdAt?: string;
}

/**
 * Volume allocation for a muscle group
 */
export interface VolumeAllocationPerMuscle {
  weekly: number; // total weekly sets for this muscle
  perSession: number; // sets per session when muscle is trained
}

/**
 * Complete volume allocation for all muscles
 */
export type VolumeAllocation = Partial<Record<MuscleGroup, VolumeAllocationPerMuscle>>;
