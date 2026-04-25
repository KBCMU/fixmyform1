# Task: Replace Exercise Catalog + Fix Exercise Count Range

## Goal
Replace the exercise catalog with the user's curated list from `exercises.md` (root of project). Also widen the per-session exercise count from 5-6 to 4-10 based on split, time, and experience.

## Context
- Current exercise catalog: `src/lib/programBuilder/exerciseCatalog.ts` (50+ exercises)
- User's curated list: `exercises.md` (in project root)
- Exercise selector logic: `src/lib/programBuilder/exerciseSelector.ts`
- Type definitions: `src/lib/programBuilder/types.ts`
- Test file: `scripts/test-program-builder.ts` (must pass after changes)

The user has curated a specific list of exercises they want to use, organized by muscle group with "Best" and "Feasible" tiers. The catalog must be completely replaced while keeping the same `CatalogExercise` interface and helper functions.

## Acceptance Criteria
- [ ] All exercises from `exercises.md` are in the catalog
- [ ] Each exercise properly tagged (muscles, equipment, gym type, taxingness, experience, technique cues)
- [ ] Exercise count per session varies 4-10 based on split/time/experience (updated in `exerciseSelector.ts`)
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npx tsx scripts/test-program-builder.ts` produces reasonable output

## File 1: `src/lib/programBuilder/exerciseCatalog.ts`

**Replace the entire EXERCISE_CATALOG array** with exercises from `exercises.md`. Keep the same `CatalogExercise` interface and helper functions. Tag each exercise accurately.

### Complete Exercise List from exercises.md

**Chest:**
- Best: Pec Deck, Machine Chest Press, Smith Machine Bench Press, Smith Machine Incline Bench Press, Upper Chest Fly, Incline Machine Press
- Feasible: Flat Dumbbell Press, Incline Dumbbell Press, Barbell Bench Press, Barbell Incline Press

**Lats:**
- Best: Wide Grip Lat Pulldown, Seated Chest-Supported Lat Row Machine, Unilateral Single Arm Pulldown, Wide Grip Pullups (weighted/bodyweight), Close Neutral Grip Lat Pulldown
- Feasible: Bench Supported Dumbbell Row

**Traps:**
- Best: Kelso Shrugs (machine/dumbbell/smith), Chest Supported Upper Back Row, Dumbbell Bench Supported Upper Back Row

**Biceps:**
- Best: Machine Preacher Curl, Seated Curl Machine, Dumbbell Preacher Curl
- Feasible: Dumbbell Curl, Cable Curl

**Triceps:**
- Best: Cable Unilateral Extension, Cable Extensions, Cable Overhead Extensions, Machine Dip, JM Press
- Feasible: Dumbbell Overhead Extension

**Shoulders:**
- Best: Machine Shoulder Press, Machine/Cable Lateral Raise, Reverse Pec Deck, Reverse Cable Fly
- Feasible: Dumbbell Lateral Raise, Dumbbell Shoulder Press, Dumbbell Rear Delt Fly

**Quads:**
- Best: Leg Extension, Hack Squat, Leg Press, Smith Machine Squat
- Feasible: Barbell Squat, Split Squat

**Hamstrings:**
- Best: Stiff Leg Deadlift (barbell/smith), Lying Leg Curl, Seated Leg Curl, 45 Degree Extension
- Feasible: (none listed separately)

**Glutes:**
- Best: Machine Hip Thrust, Barbell Hip Thrust, Smith Machine Hip Thrust, Romanian Deadlift (barbell/smith)

**Adductors:**
- Adductor Machine, SLDL (as secondary), RDL (as secondary)

**Abductors:**
- Abductor Machine

**Abs:**
- Cable Crunch, Machine Crunch, Decline Crunch (weighted/bodyweight)

**Calves:**
- Best: Machine Calf Raise, Standing Calf Raise, Calf Raise on Leg Press Machine
- Feasible: Seated Calf Raise

### Tagging Rules

1. **primaryMuscles**: The ONE main muscle the exercise targets. For compounds like Leg Press = `['quads']` with `secondaryMuscles: ['glutes', 'hamstrings']`. SLDL/RDL = `['hamstrings']` with `secondaryMuscles: ['glutes', 'adductors']`.

2. **movementPattern**: Use existing MovementPattern union from types.ts. May need to add: `'trap_row'`, `'hip_extension'`, `'adduction'`, `'abduction'` to the union if not present. Assign the most specific pattern.

3. **equipment**: tag accurately (machine, cable, smith_machine, barbell, dumbbell, bodyweight). For "Kelso Shrugs (machine/dumbbell/smith)", create ONE entry per equipment variant if used differently, or use an array of the most common.

4. **gymTypes**: 
   - `['commercial']` for machines only
   - `['commercial', 'home']` for barbell/dumbbell/smith_machine/bodyweight
   - Most equipment = commercial, but smith_machine and barbell/dumbbell are home-friendly

5. **taxingness**: 
   - `'high'` ONLY for heavy barbell compounds (barbell bench, barbell squat, barbell SLDL, barbell RDL, barbell hip thrust)
   - `'moderate'` for smith_machine compounds, cable compounds, dumbbell compounds, and weight machine compounds
   - `'low'` for isolation machines and exercises with light/fixed weight

6. **experienceMin**: 
   - `'never'` for machines (no technique required)
   - `'beginner'` for cables, dumbbells, lighter barbell movements
   - `'intermediate'` for barbell compounds (bench, squat, deadlifts), JM press
   - `'advanced'` is rarely needed (none in this list)

7. **muscleBias**: Set where applicable (e.g., Incline Bench = `'chest_upper'`, Reverse Pec Deck = `'delts_rear'`, Machine Lateral Raise = `'delts_lateral'`, Seated Leg Curl = `'hamstrings'`, etc.)

8. **techniqueCues**: 2-3 brief, actionable cues per exercise

### Helper Functions to Keep
- `getExercisesByPattern(pattern)`, `getExercisesByMuscle(muscle)`, `getExercisesForGym(gymType)`, `getExerciseById(id)`

## File 2: `src/lib/programBuilder/types.ts`

**Check if needed MovementPattern values exist:**
- `'trap_row'` or similar for trap-focused rows
- `'hip_extension'` for hip thrust (currently might use `'hip_hinge'`)
- `'adduction'` and `'abduction'` for adductors/abductors

**Check MuscleGroup union:**
- Ensure `'adductors'` and `'abductors'` exist. If not, add them.

If any are missing, add them to the appropriate union type.

## File 3: `src/lib/programBuilder/exerciseSelector.ts`

**Update exercise count logic:**

1. **getMaxExercises()** function: Change range from `clamp(estimated, 5, 10)` to `clamp(estimated, 4, 10)`.

2. **getTargetExerciseCount()** function: Update logic to be more dynamic based on split type:
   - **Full body** (9+ muscles): 7-10 exercises (more variety needed)
   - **Upper/Lower** (6-8 muscles): 5-7 exercises
   - **3-day splits** (4-6 muscles): 4-6 exercises

3. **Time-based adjustment**: The current time-per-set calculation should naturally support 4-10 range. Verify it does:
   - 30 min → ~4-5 exercises
   - 45 min → ~5-7 exercises
   - 60 min → ~6-8 exercises
   - 75 min → ~7-9 exercises
   - 90 min → ~8-10 exercises

4. **Experience adjustment**: Beginners can do slightly fewer exercises (more sets per exercise), advanced slightly more.

## Implementation Notes

1. **Variants**: For exercises that list multiple equipment (e.g., "Kelso Shrugs (machine/dumbbell/smith)"), create separate entries for each if they're truly distinct movements, OR use the array syntax in the equipment field. Prefer separate entries with descriptive names (e.g., "Kelso Shrug Machine", "Kelso Shrug Dumbbell", "Kelso Shrug Smith").

2. **45 Degree Extension**: This is a 45-degree leg press calf variant. Call it "45 Degree Leg Press Calf Raise" or "45 Leg Extension". Likely `taxingness: 'low'` or `'moderate'`.

3. **JM Press**: This is a hybrid between bench and shoulder press. `movementPattern: 'vertical_push'` or `'horizontal_push'` (closer to horizontal). `primaryMuscles: ['triceps']` with `secondaryMuscles: ['chest', 'shoulders']`. `experienceMin: 'intermediate'` (requires technique).

4. **Pullups**: "Wide Grip Pullups (weighted or bodyweight)" — use `equipment: ['bodyweight']` and note weighting is optional. `experienceMin: 'intermediate'`.

5. **Upper Chest Fly**: Isolation version of incline work. `movementPattern: 'horizontal_push'`, `muscleBias: 'chest_upper'`.

6. **Decline Crunch**: Can be weighted or bodyweight. Use `equipment: ['machine']` or `['bodyweight']`. Suggest machine version as primary since the user listed "weighted" variant.

7. **Split Squat**: Unilateral quad/leg exercise. `movementPattern: 'lunge'`, `primaryMuscles: ['quads']`, `secondaryMuscles: ['glutes', 'hamstrings']`.

8. **Match IDs to names** in camelCase (e.g., 'pec-deck', 'machine-chest-press', 'wide-grip-lat-pulldown', 'kelso-shrug-machine').

9. **Run `npx tsc --noEmit`** after edits to ensure all types are correct.

10. **Run `npx tsx scripts/test-program-builder.ts`** to verify output looks reasonable.

## Verification

Run these commands in the project root:
```bash
npx tsc --noEmit
npx tsx scripts/test-program-builder.ts
```

Both should complete without errors. The test output should show:
- 4-10 exercises per workout (not always 5-6)
- Reasonable exercise variety
- No duplicate exercises in a single day
