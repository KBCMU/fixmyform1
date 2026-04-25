# Task: Program Builder Rules Engine Bug Fixes

## Goal
Fix critical bugs in the program builder rules engine that produce incorrect, unusable programs. The output currently has too many exercises, wrong muscle targeting, duplicate exercises, no day variation, and incorrect taxingness labels.

## Bug List (ALL must be fixed)

### Bug 1: Full Body split returns 2 days instead of 3
**File**: `src/lib/programBuilder/programAssembler.ts` line 17
**Cause**: `availableSplits.find(s => s.type === profile.selectedSplit)` matches the first `full_body` split which has `daysPerWeek: 2`, even when the user selected 3 days.
**Fix**: Match on BOTH `type` AND `daysPerWeek`:
```typescript
const split = availableSplits.find(s => s.type === profile.selectedSplit && s.daysPerWeek === profile.daysPerWeek)
  || availableSplits.find(s => s.type === profile.selectedSplit); // fallback
```

### Bug 2: Too many exercises per session (16+ for full body)
**File**: `src/lib/programBuilder/exerciseSelector.ts`
**Cause**: The selector picks 1 compound + 1 isolation for EVERY target muscle. Full body has 10 muscles → 20 exercises. A 60-minute session should have ~6-10 exercises max.
**Fix**: 
1. Calculate max exercises from session time: `maxExercises = Math.floor(minutesPerSession / (avgSetsPerExercise * 4))` where 4 min per set. For 60 min with ~3 sets/exercise: ~5 exercises. Adjust upward slightly (use ~3 min per set for machines): ~6-8 exercises.
2. Distribute exercises across muscles based on volume priority. Not every muscle needs a dedicated exercise every session — compound movements cover multiple muscles.
3. For full body: pick 6-10 exercises total, covering all major patterns. E.g.: 1 push (chest+triceps+shoulders), 1 pull (back+biceps), 1 squat (quads+glutes), 1 hinge (hamstrings+glutes), then 2-4 isolation exercises for priority muscles.

### Bug 3: Leg Press appears 3 times (for quads, hamstrings, glutes)
**File**: `src/lib/programBuilder/exerciseCatalog.ts`
**Cause**: Leg Press has `primaryMuscles: ['quads', 'glutes', 'hamstrings']`. The selector iterates each target muscle and picks Leg Press for all three.
**Fix TWO things**:
1. In the catalog: Leg Press should have `primaryMuscles: ['quads']` and `secondaryMuscles: ['glutes', 'hamstrings']`. Same for Smith Squat, Hack Squat, Machine Leg Press. The compound exercises cover secondary muscles but shouldn't be the PRIMARY pick for those muscles.
2. In the selector: Track which exercises are already used. Never pick the same exercise twice. When a compound covers secondary muscles, count those sets toward the secondary muscle's volume.

### Bug 4: Lateral Raise Machine shows as [chest] target
**File**: `src/lib/programBuilder/exerciseSelector.ts` line 41
**Cause**: Weak-point slot creation uses `day.targetMuscles[0]` (which is 'chest' for upper day) instead of the exercise's actual primary muscle.
**Fix**: Use `selected.primaryMuscles[0]` instead of `day.targetMuscles[0]` in the weak-point loop. Also pass it correctly to `createExerciseSlot`.

### Bug 5: Day A and Day B are identical
**File**: `src/lib/programBuilder/exerciseSelector.ts`
**Cause**: The selector always picks `suitableExercises[0]` — no variation logic.
**Fix**: Pass a `dayIndex` parameter to `selectExercises`. For even days, pick from the start of the list; for odd days, pick from further down (or reverse priority). This creates natural A/B variation. E.g., Day A picks exercise[0], Day B picks exercise[1] (or wraps).

### Bug 6: Machine exercises incorrectly tagged as high taxingness
**File**: `src/lib/programBuilder/exerciseCatalog.ts`
**Cause**: Exercises like Machine Chest Press, Incline Machine Press, Machine Shoulder Press, Barbell Curl, Machine Dip, Hip Thrust Machine are all tagged `taxingness: 'high'`.
**Fix**: Only these should be `high` taxingness (heavy free-weight compounds that are genuinely taxing):
- SLDL (barbell)
- Romanian Deadlift (barbell/dumbbell)
- Smith Machine Squat
- Leg Press (borderline — keep as high)
- Hack Squat
- Nordic Hamstring Curl

Everything else should be `moderate` or `low`:
- ALL machine presses → `moderate`
- ALL cable exercises → `moderate` or `low`
- Barbell Curl → `moderate`
- Machine Dip → `moderate`
- Hip Thrust Machine → `moderate`
- Isolation machines (pec deck, lat raise, leg extension, leg curl) → `low`
- Calf raises → `low`
- Core exercises → `low`

### Bug 7: Home gym has almost no exercises
**File**: `src/lib/programBuilder/exerciseCatalog.ts`
**Cause**: Very few exercises have `'home'` in their `gymTypes` array. Dumbbells and bands are common home equipment.
**Fix**: Add `'home'` to gymTypes for exercises that work with dumbbells, barbells, bodyweight, or bands. At minimum:
- Dumbbell Curl ✓ (probably already has it)
- Barbell Curl ✓
- SLDL, RDL ✓
- Smith Machine exercises (some home gyms have smith machines, but not most — leave as-is or add selectively)
- Add a few dumbbell exercises if not present: dumbbell bench press (horizontal_push), dumbbell row (horizontal_pull), dumbbell lateral raise (shoulder_abduction), dumbbell overhead press (vertical_push)
- Bodyweight exercises should all have 'home'

### Bug 8: Exercise selector uses taxingness === 'high' as proxy for "compound"
**File**: `src/lib/programBuilder/exerciseSelector.ts` line 57
**Cause**: `ex.taxingness === 'high'` is used to filter compounds. After fixing Bug 6 (fewer high-taxingness exercises), many compounds won't be selected.
**Fix**: Don't use taxingness to identify compounds. Instead, define compound movement patterns:
```typescript
const COMPOUND_PATTERNS: MovementPattern[] = [
  'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull',
  'hip_hinge', 'squat', 'lunge'
];
```
An exercise is a "compound" if its movementPattern is in this list. Isolation patterns: `knee_flexion`, `knee_extension`, `elbow_flexion`, `elbow_extension`, `shoulder_abduction`, `hip_abduction`, `calf_raise`, `core_flexion`, `core_rotation`.

## Expected Output After Fixes

Running the test script `scripts/test-program-builder.ts` should produce:

**Beginner, 3 days, Full Body, Commercial Gym:**
- 3 workout days (not 2)
- ~6-8 exercises per session (not 16)
- No duplicate exercises
- All major muscles covered via compound + isolation mix
- Day variation (A ≠ B ≠ C)
- Rep ranges: mostly 8-12 (beginner), compounds at 8-12, heavy hinges at 4-6

**Advanced, 5 days, UL Rest Repeat:**
- 5 days (2 upper, 2 lower, 1 rest)
- ~6-8 exercises per upper day, ~5-7 per lower day
- Weak-point exercises sequenced first with correct muscle labels
- Day A ≠ Day B variation
- Rep ranges: mostly 5-8 (advanced), heavy at 4-6

**Intermediate, 4 days, Upper/Lower, Home Gym:**
- 4 days with reasonable exercise count
- All major muscles covered (back must be present in upper days!)
- Only exercises available with home gym equipment

## Files to Modify
- `src/lib/programBuilder/exerciseCatalog.ts` — taxingness fixes, primaryMuscles fixes, home gym coverage
- `src/lib/programBuilder/exerciseSelector.ts` — complete rewrite of selection logic
- `src/lib/programBuilder/programAssembler.ts` — split matching fix, pass dayIndex
- `src/lib/programBuilder/types.ts` — add dayIndex to selectExercises signature if needed

## Acceptance Criteria
- [ ] Full body 3 days generates 3 workout days
- [ ] No more than 10 exercises per session (ideally 6-8)
- [ ] No duplicate exercises within a session
- [ ] Compound exercises cover secondary muscles (counted toward volume)
- [ ] Weak-point exercises show correct target muscle
- [ ] Day A and Day B have different exercises
- [ ] Home gym generates at least 4-5 exercises per session
- [ ] Taxingness correctly assigned (only heavy barbell/leg machines are 'high')
- [ ] Compound detection uses movement pattern, not taxingness
- [ ] Test script passes with reasonable output for all 3 profiles

## Implementation Notes
- Run `npx tsx scripts/test-program-builder.ts` after each major change to verify
- The volume calculator is fine — don't change it
- The split recommender splits are fine — just fix the matching in programAssembler
- The rep range assigner is fine — fixing taxingness in the catalog will fix rep ranges
- Focus the rewrite on exerciseSelector.ts — that's where most bugs live
