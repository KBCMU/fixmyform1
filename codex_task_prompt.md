You are implementing critical bug fixes in a TypeScript fullstack web project's program builder rules engine.

## TASK
Fix 8 critical bugs in the program builder system that produce incorrect, unusable training programs. The output currently has too many exercises per session, wrong muscle targeting, duplicate exercises, no day variation, and incorrect taxingness labels.

## CONTEXT
**Relevant Files**:
- `src/lib/programBuilder/exerciseCatalog.ts` — Exercise database with ~40 exercises
- `src/lib/programBuilder/exerciseSelector.ts` — Selection logic that picks exercises for a session
- `src/lib/programBuilder/programAssembler.ts` — Orchestrates the program generation
- `src/lib/programBuilder/types.ts` — Type definitions
- `scripts/test-program-builder.ts` — Test script to verify fixes

**Key Types**:
- `UserProfile`: experience, daysPerWeek, minutesPerSession, gymType, selectedSplit, weakPoints
- `TrainingDay`: name, targetMuscles (array of MuscleGroup)
- `CatalogExercise`: id, name, movementPattern, primaryMuscles[], secondaryMuscles[], taxingness, gymTypes[], experienceMin, etc.
- `MovementPattern`: horizontal_push, vertical_push, horizontal_pull, vertical_pull, hip_hinge, squat, lunge, knee_flexion, knee_extension, shoulder_abduction, hip_abduction, elbow_flexion, elbow_extension, calf_raise, core_flexion, core_rotation

**Critical Information**:
- A session time of 60 minutes with ~3 sets per exercise and 4 minutes per set = ~5-6 exercises. Adjust to 6-8 for machines (3 min per set).
- Compound movement patterns: horizontal_push, vertical_push, horizontal_pull, vertical_pull, hip_hinge, squat, lunge
- Isolation patterns: knee_flexion, knee_extension, elbow_flexion, elbow_extension, shoulder_abduction, hip_abduction, calf_raise, core_flexion, core_rotation
- Full Body split has TWO variants: one with daysPerWeek: 2 and one with daysPerWeek: 3

## ACCEPTANCE CRITERIA
- [ ] Bug 1: Full body 3 days returns 3 workout days (not 2) — split matching includes daysPerWeek
- [ ] Bug 2: Max 10 exercises per session (ideally 6-8) — calculated from minutesPerSession
- [ ] Bug 3: No duplicate exercises within a session — tracked via usedExerciseIds
- [ ] Bug 4: Weak-point exercises show correct target muscle (their primaryMuscles[0], not day.targetMuscles[0])
- [ ] Bug 5: Day A and Day B have different exercises — dayIndex parameter creates A/B variation
- [ ] Bug 6: Taxingness correctly assigned — only heavy barbell/leg machines are 'high'
- [ ] Bug 7: Home gym has 4-5+ exercises per session — more exercises have 'home' in gymTypes
- [ ] Bug 8: Compounds detected by movementPattern, not taxingness
- [ ] Test script runs successfully with reasonable output for all 3 profiles

## DETAILED BUG FIXES

### Bug 1: Full Body split returns 2 days instead of 3
**File**: `src/lib/programBuilder/programAssembler.ts` line 17
**Problem**: `availableSplits.find(s => s.type === profile.selectedSplit)` matches the first `full_body` split which has `daysPerWeek: 2`, even when user selected 3 days.
**Solution**: Match on BOTH `type` AND `daysPerWeek`:
```typescript
const split = availableSplits.find(s => s.type === profile.selectedSplit && s.daysPerWeek === profile.daysPerWeek)
  || availableSplits.find(s => s.type === profile.selectedSplit); // fallback
```

### Bug 2: Too many exercises per session (16+ for full body)
**File**: `src/lib/programBuilder/exerciseSelector.ts`
**Problem**: Selector picks 1 compound + 1 isolation for EVERY target muscle. Full body has 10 muscles → 20 exercises.
**Solution**: Rewrite the entire `selectExercises` function with this logic:
1. Calculate maxExercises from session time: `Math.max(5, Math.floor(profile.minutesPerSession / (3 * 4)))` (assume ~3 sets per exercise, 4 min per set for machines)
2. Limit total exercises to maxExercises
3. Prioritize: weak points (if advanced) → compounds → isolations
4. Deduplicate (track usedExerciseIds)
5. For full body with 10 muscles, aim for ~1-2 compounds (covering 4-5 muscles) + 2-3 isolations = 6-8 total

### Bug 3: Leg Press appears 3 times (for quads, hamstrings, glutes)
**File**: `src/lib/programBuilder/exerciseCatalog.ts` + `src/lib/programBuilder/exerciseSelector.ts`
**Problems**:
1. Leg Press has `primaryMuscles: ['quads', 'glutes', 'hamstrings']` — should be `['quads']` only
2. Other leg compounds (Smith Squat, Hack Squat, Machine Leg Press V2) have same issue
3. Selector doesn't track which exercises are already used
**Solutions**:
1. **In catalog**: Fix primaryMuscles:
   - Leg Press: `primaryMuscles: ['quads']`, `secondaryMuscles: ['glutes', 'hamstrings']`
   - Smith Squat: `primaryMuscles: ['quads']`, `secondaryMuscles: ['glutes', 'hamstrings']`
   - Hack Squat: Already correct (only quads in primaryMuscles)
   - Machine Leg Press V2: `primaryMuscles: ['quads']`, `secondaryMuscles: ['glutes', 'hamstrings']`
2. **In selector**: 
   - Maintain a Set<string> of usedExerciseIds throughout function
   - Before selecting an exercise, check if it's already in usedExerciseIds; skip if so
   - When a compound covers secondary muscles (e.g., Leg Press secondaryMuscles includes 'hamstrings'), count those sets toward secondary muscles' volume

### Bug 4: Lateral Raise Machine shows as [chest] target
**File**: `src/lib/programBuilder/exerciseSelector.ts` line 40-41
**Problem**: Weak-point slot creation uses `day.targetMuscles[0]` (which is 'chest' for upper day) instead of the exercise's actual primary muscle.
**Solution**: Use `selected.primaryMuscles[0]` instead of `day.targetMuscles[0]`:
```typescript
const slot = createExerciseSlot(
  selected,
  selected.primaryMuscles[0],  // ← Change from day.targetMuscles[0]
  biasedExercises,
  profile,
  orderPriority,
);
```

### Bug 5: Day A and Day B are identical
**File**: `src/lib/programBuilder/exerciseSelector.ts`
**Problem**: Selector always picks `suitableExercises[0]` — no variation logic.
**Solution**:
1. Add `dayIndex?: number` parameter to `selectExercises` function
2. Pass `index` from programAssembler when calling selectExercises: `selectExercises(day, profile, volumeAllocation, index)`
3. When picking exercises, vary the selection based on dayIndex:
   - For even days (0, 2, 4...), pick from start of suitableExercises
   - For odd days (1, 3, 5...), pick from middle/end or rotate: `suitableExercises[Math.min(Math.floor(dayIndex / 2), suitableExercises.length - 1)]`
   - This creates natural A/B/C variation

### Bug 6: Machine exercises incorrectly tagged as high taxingness
**File**: `src/lib/programBuilder/exerciseCatalog.ts`
**Problem**: Exercises like Machine Chest Press, Incline Machine Press, Machine Shoulder Press, Barbell Curl, Machine Dip, Hip Thrust Machine are all tagged `taxingness: 'high'` but aren't genuinely taxing.
**Solution**: Only these should be `high` taxingness (heavy free-weight compounds):
- SLDL (barbell)
- Romanian Deadlift (barbell/dumbbell)
- Smith Machine Squat
- Leg Press (keep as high)
- Hack Squat
- Nordic Hamstring Curl

Everything else should be `moderate` or `low`:
- Machine Chest Press → `moderate`
- Incline Machine Press → `moderate`
- Machine Shoulder Press → `moderate`
- Barbell Curl → `moderate` (was high)
- Machine Dip → `moderate` (was high)
- Hip Thrust Machine → `moderate` (was high)
- ALL isolation machines (pec deck, lat raise, leg extension, leg curl, etc.) → `low`

### Bug 7: Home gym has almost no exercises
**File**: `src/lib/programBuilder/exerciseCatalog.ts`
**Problem**: Very few exercises have `'home'` in their `gymTypes` array.
**Solution**: Add `'home'` to gymTypes for exercises that work with dumbbells, barbells, or bodyweight. At minimum:
- Dumbbell Curl (already has it)
- Barbell Curl (already has it)
- SLDL (barbell) (already has it)
- Romanian Deadlift (already has it)
- Nordic Curl (already has it)
- Smith Machine Bench Press (already has it)
- Smith Machine Hip Thrust (already has it)
- Add NEW exercises if needed:
  - Dumbbell Bench Press (horizontal_push, primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'], low/moderate taxingness)
  - Dumbbell Row (horizontal_pull, primaryMuscles: ['back'], secondaryMuscles: ['biceps'], moderate taxingness)
  - Dumbbell Lateral Raise (shoulder_abduction, primaryMuscles: ['shoulders'], low taxingness)
  - Dumbbell Overhead Press (vertical_push, primaryMuscles: ['shoulders'], secondaryMuscles: ['triceps'], moderate taxingness)
- Or add 'home' to existing dumbbell/barbell exercises if not present

### Bug 8: Exercise selector uses taxingness === 'high' as proxy for "compound"
**File**: `src/lib/programBuilder/exerciseSelector.ts` line 57
**Problem**: Code filters `ex.taxingness === 'high'` to identify compounds. After fixing Bug 6, many compounds won't be selected.
**Solution**: Define compound patterns at the top of the file:
```typescript
const COMPOUND_PATTERNS: MovementPattern[] = [
  'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull',
  'hip_hinge', 'squat', 'lunge'
];
```
Then filter by movement pattern instead:
```typescript
const isCompound = (ex: CatalogExercise) => COMPOUND_PATTERNS.includes(ex.movementPattern);
```
Use this throughout the selector instead of `ex.taxingness === 'high'`.

## IMPLEMENTATION NOTES
- Run `npx tsx scripts/test-program-builder.ts` after changes to verify output
- The volume calculator (volumeCalculator.ts) is fine — don't change it
- The split recommender splits are fine — just fix matching in programAssembler
- The rep range assigner (repRangeAssigner.ts) is fine — fixing taxingness will fix rep ranges
- **Focus the major rewrite on exerciseSelector.ts** — that's where most bugs live
- Keep TypeScript strict mode enabled
- Don't break any existing type signatures unless absolutely necessary
- Use TypeScript strict typing throughout

## EXPECTED OUTPUT AFTER FIXES
Running `npx tsx scripts/test-program-builder.ts`:

**Beginner, 3 days, Full Body, Commercial Gym:**
- 3 workout days (not 2)
- ~6-8 exercises per session (not 16)
- No duplicate exercises
- All major muscles covered via compound + isolation mix
- Day variation (A ≠ B ≠ C)
- Rep ranges: mostly 8-12

**Advanced, 5 days, UL Rest Repeat:**
- 5 days (2 upper, 2 lower, 1 rest)
- ~6-8 exercises per upper day, ~5-7 per lower day
- Weak-point exercises sequenced first with correct muscle labels
- Day A ≠ Day B variation
- Rep ranges: mostly 5-8

**Intermediate, 4 days, Upper/Lower, Home Gym:**
- 4 days with reasonable exercise count
- All major muscles covered
- Only exercises available with home gym equipment
- At least 4-5 exercises per session
