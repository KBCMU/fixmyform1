# Task: Program Builder Foundation (Types + Exercise Catalog + Rules Engine)

## Goal
Create the complete TypeScript foundation for the program builder feature: type definitions, a curated exercise catalog (~30-40 exercises), and a rules engine that generates hypertrophy programs deterministically.

## Context
- Project: Next.js 15 + TypeScript (strict mode) + Tailwind CSS v4
- Existing exercise interface: `src/lib/exercises.ts` (has `Exercise` interface, but this is for form analysis — the program builder needs its own richer catalog)
- Existing types pattern: `src/lib/formEvaluation/types.ts`
- All new files go in `src/lib/programBuilder/`
- This is a NEW feature — no existing program builder code exists

## Files to Create

### 1. `src/lib/programBuilder/types.ts`

Define these interfaces/types:

```typescript
// Experience levels
type ExperienceLevel = 'never' | 'beginner' | 'intermediate' | 'advanced';
// Maps to: never trained / 0-1 years / 1-3 years / 3+ years

// Gym types (determines equipment availability)
type GymType = 'commercial' | 'home' | 'hotel';

// Movement patterns for exercise categorization
type MovementPattern =
  | 'horizontal_push' | 'vertical_push'
  | 'horizontal_pull' | 'vertical_pull'
  | 'hip_hinge' | 'squat' | 'lunge'
  | 'knee_flexion' | 'knee_extension'
  | 'hip_abduction' | 'hip_adduction'
  | 'shoulder_abduction' | 'shoulder_flexion'
  | 'elbow_flexion' | 'elbow_extension'
  | 'calf_raise'
  | 'core_flexion' | 'core_rotation';

// Muscle groups
type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'triceps' | 'biceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'forearms';

// Muscle bias for advanced categorization (stretch-biased, etc.)
type MuscleBias =
  | 'chest_upper' | 'chest_lower' | 'chest_overall'
  | 'lats_upper' | 'lats_lower'
  | 'delts_front' | 'delts_lateral' | 'delts_rear'
  | 'triceps_long' | 'triceps_medial_lateral'
  | 'biceps_brachialis' | 'biceps_long_short';

// Length-tension relationship
type LengthTension = 'lengthened' | 'shortened' | 'mid_range';

// Equipment types
type Equipment = 'machine' | 'cable' | 'barbell' | 'dumbbell' | 'bodyweight' | 'smith_machine' | 'band';

// How taxing the exercise is (affects rep ranges)
type Taxingness = 'high' | 'moderate' | 'low';

// A single exercise in the catalog
interface CatalogExercise {
  id: string;
  name: string;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  muscleBias?: MuscleBias;
  lengthTension?: LengthTension;
  equipment: Equipment[];
  gymTypes: GymType[];           // which gym types have this equipment
  taxingness: Taxingness;
  experienceMin: ExperienceLevel;
  techniqueCues: string[];
  referenceVideoUrl?: string;
  referenceVideoCredit?: string;
}

// Split types
type SplitType =
  | 'full_body'
  | 'upper_lower'
  | 'anterior_posterior'
  | 'push_pull_legs'
  | 'upper_lower_ppl';  // 5-day: UL + PPL

// A training day in the split
interface TrainingDay {
  name: string;            // e.g., "Upper A", "Full Body", "Push"
  targetMuscles: MuscleGroup[];
}

// A split definition
interface SplitDefinition {
  type: SplitType;
  name: string;             // display name
  description: string;      // brief explanation
  daysPerWeek: number;
  weekStructure: TrainingDay[];  // ordered by day
  recommended?: boolean;
}

// User profile from the wizard questionnaire
interface UserProfile {
  experience: ExperienceLevel;
  daysPerWeek: number;      // 2-6
  minutesPerSession: number; // 30, 45, 60, 75, 90
  gymType: GymType;
  weakPoints?: MuscleBias[]; // only for advanced
  selectedSplit: SplitType;
}

// A single exercise slot in the generated program
interface ExerciseSlot {
  id: string;                    // unique slot ID
  selectedExercise: CatalogExercise;
  alternatives: CatalogExercise[]; // same movement pattern, swappable
  sets: number;
  repRange: [number, number];    // e.g., [8, 12]
  targetMuscle: MuscleGroup;
  movementPattern: MovementPattern;
  orderPriority: number;         // lower = earlier in workout
}

// A single day's workout
interface WorkoutDay {
  dayName: string;         // e.g., "Day 1 - Upper A"
  exercises: ExerciseSlot[];
}

// The complete generated program
interface GeneratedProgram {
  id?: string;
  profile: UserProfile;
  split: SplitDefinition;
  workouts: WorkoutDay[];
  explanation?: string;     // LLM-generated rationale (added later)
  createdAt?: string;
}
```

Export all types.

### 2. `src/lib/programBuilder/exerciseCatalog.ts`

Create a curated array of ~30-40 `CatalogExercise` objects. IMPORTANT rules:
- **Predominantly machine-based or stable exercises** — no gimmick movements
- **Cover ALL body parts**: chest, back, shoulders (all 3 heads), biceps, triceps, quads, hamstrings, glutes, calves, core
- Free weights only where machines aren't suitable (e.g., SLDL for hamstrings, dumbbell curls)
- Tag every exercise with: movementPattern, primaryMuscles, equipment, gymTypes, taxingness, experienceMin
- Include muscleBias and lengthTension where applicable
- Add 2-3 brief techniqueCues per exercise
- Leave referenceVideoUrl as undefined (will be populated later)

Example exercises to include (not exhaustive — use your judgment to fill ~30-40 total):
- **Chest**: Machine chest press, pec deck, cable fly, smith bench press, incline machine press
- **Back**: Lat pulldown, seated cable row, machine row, cable pullover
- **Shoulders**: Lateral raise machine, cable lateral raise, reverse pec deck (rear delts), machine shoulder press
- **Biceps**: Machine preacher curl, cable curl, dumbbell curl
- **Triceps**: Cable pushdown, machine dip, overhead cable extension
- **Quads**: Leg extension, leg press, smith squat, hack squat
- **Hamstrings**: Lying leg curl, seated leg curl, SLDL (barbell), Romanian deadlift
- **Glutes**: Hip thrust machine, cable pull-through, glute kickback machine
- **Calves**: Seated calf raise, standing calf raise machine
- **Core**: Cable crunch, machine crunch

Export: `EXERCISE_CATALOG: CatalogExercise[]`
Export helper functions:
- `getExercisesByPattern(pattern: MovementPattern): CatalogExercise[]`
- `getExercisesByMuscle(muscle: MuscleGroup): CatalogExercise[]`
- `getExercisesForGym(gymType: GymType): CatalogExercise[]`
- `getExerciseById(id: string): CatalogExercise | undefined`

### 3. `src/lib/programBuilder/splitRecommender.ts`

Given days per week, return available splits:

```
2-3 days → [Full Body]
4 days   → [Full Body EOD, Upper/Lower 2x, Anterior/Posterior 2x]
5 days   → [UL rest repeat, AP rest repeat, UL+PPL]
6 days   → [UL 3x, AP 3x]
```

Rules:
- Lower day-count splits CAN be offered for higher day counts too (e.g., Full Body for 4 days)
- Mark recommended splits: Full Body EOD/3x, UL or AP rest repeat
- Each split must define its full `weekStructure` with target muscles per day

Export: `getRecommendedSplits(daysPerWeek: number): SplitDefinition[]`

### 4. `src/lib/programBuilder/volumeCalculator.ts`

Calculate weekly and per-session volume:

```
Weekly sets per muscle group:
  never/beginner (0-1yr): 6-12 sets
  intermediate (1-3yr):   5-10 sets
  advanced (3+yr):        3-9 sets

Per-workout sets per muscle (by frequency):
  3x/week: 1-4 sets per muscle
  2x/week: 2-5 sets per muscle
  1x/week: 3-9 sets per muscle
```

Time constraint: Estimate ~4 min per set (including rest). If minutesPerSession limits total sets, reduce volume proportionally but keep minimum thresholds.

Export: `calculateVolume(profile: UserProfile, split: SplitDefinition): VolumeAllocation`
Where `VolumeAllocation` maps each muscle to weekly sets and per-session sets.

### 5. `src/lib/programBuilder/repRangeAssigner.ts`

Assign rep ranges based on taxingness + experience:

```
High taxingness (heavy compounds): 4-6 reps
Moderate taxingness:
  never/beginner: 8-12
  intermediate: 6-10
  advanced: 5-8
Low taxingness (small/big-increment exercises): 10-15
```

Export: `getRepRange(exercise: CatalogExercise, experience: ExperienceLevel): [number, number]`

### 6. `src/lib/programBuilder/exerciseSelector.ts`

Select exercises for each training day:

Given a split day's target muscles + user profile:
1. Filter catalog by: gymType, experienceMin ≤ user experience
2. For each target muscle, pick exercises by movement pattern to cover the volume
3. If user has weak points matching a muscle, add extra isolation exercises biased to that sub-region
4. Provide 2-4 alternatives per slot (same movement pattern, same gym type filter)

Exercise ordering within a day:
- **Beginners**: Compounds first, isolation after
- **Advanced with weak points**: Weak-point exercises FIRST, then compounds, then remaining isolation
- **Otherwise**: Compounds first, isolation after

Export: `selectExercises(day: TrainingDay, profile: UserProfile, volume: VolumeAllocation): ExerciseSlot[]`

### 7. `src/lib/programBuilder/programAssembler.ts`

Orchestrate all modules to produce a complete `GeneratedProgram`:

```typescript
export function generateProgram(profile: UserProfile): GeneratedProgram {
  // 1. Get the selected split definition
  // 2. Calculate volume allocation
  // 3. For each day in the split, select exercises
  // 4. Assemble into GeneratedProgram
}
```

Export: `generateProgram(profile: UserProfile): GeneratedProgram`

### 8. `src/lib/programBuilder/index.ts`

Re-export everything from a single entry point.

## Acceptance Criteria
- [ ] All TypeScript files compile with no errors under strict mode
- [ ] Exercise catalog has 30-40 exercises covering all major body parts
- [ ] All exercises tagged with movement pattern, equipment, gym type, taxingness
- [ ] Split recommender returns correct splits for each day count (2-6)
- [ ] Volume calculator respects: beginner 6-12, intermediate 5-10, advanced 3-9 weekly sets/muscle
- [ ] Rep ranges follow the specified rules per taxingness and experience
- [ ] Exercise selector filters by gym type and experience
- [ ] Exercise ordering follows beginner/advanced rules
- [ ] programAssembler produces a valid GeneratedProgram from any valid UserProfile
- [ ] All functions are properly typed and exported

## Implementation Notes
- Follow existing code patterns in `src/lib/formEvaluation/`
- Use the existing `Exercise` interface in `src/lib/exercises.ts` as a reference but do NOT modify it
- No database calls in this task — everything is in-memory TypeScript
- No React components in this task — pure logic only
