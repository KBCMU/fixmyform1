# Progress

## 2026-04-23 — Program Builder Feature (Full Implementation)

### Phase 1: Types + Exercise Catalog + Rules Engine
- Delegated to: openrouter-implementer (qwen3-30b)
- Spec: task_specs/program-builder-foundation.md
- Status: done
- Output: src/lib/programBuilder/ (8 files, ~1,650 lines)
  - types.ts, exerciseCatalog.ts (46 exercises), splitRecommender.ts, volumeCalculator.ts, repRangeAssigner.ts, exerciseSelector.ts, programAssembler.ts, index.ts

### Phase 2: Wizard UI
- Delegated to: sonnet subagent
- Spec: task_specs/program-builder-wizard-ui.md
- Status: done
- Output: src/app/program/new/page.tsx + src/components/program/ (9 files)
  - ExperienceStep, ScheduleStep, LocationStep, WeakPointsStep, SplitStep, AuthGate, GenerateStep

### Phase 3: Program Display + Swapping
- Delegated to: sonnet subagent
- Spec: task_specs/program-builder-display.md
- Status: done
- Output: src/app/program/[id]/page.tsx + src/components/program/ (3 files)
  - ProgramView, ExerciseCard (progressive disclosure), WeekView (day tabs)

### Phase 4: API Routes + LLM Integration
- Delegated to: codex-implementer
- Spec: task_specs/program-builder-api.md
- Status: done
- Output: src/app/api/program/ (2 routes) + supabase/migrations/004_user_programs.sql
  - POST /api/program/generate (rules engine + OpenRouter LLM explanation)
  - POST /api/program/save (Supabase insert with RLS)

### Phase 5: Programs List Page
- Done inline (replaced Coming Soon placeholder)
- Output: src/app/program/page.tsx

### Integration Fixes (orchestrator)
- Consolidated component types → re-export from canonical lib/programBuilder/types
- Added user_programs to database.types.ts
- Fixed Supabase Insert type errors in save route
- TypeScript strict mode: PASSING

## 2026-04-23 — Program Builder Bug Fixes (8 Critical Bugs)

### Bugs Fixed
- Delegated to: codex-implementer (implementation by orchestrator)
- Spec: task_specs/program-builder-bugfixes.md
- Status: done
- Output files: src/lib/programBuilder/exerciseCatalog.ts, src/lib/programBuilder/exerciseSelector.ts, src/lib/programBuilder/programAssembler.ts

### Bug Fixes Details
- **Bug 1**: Full Body split matching - now checks BOTH type AND daysPerWeek to return correct 3-day split
- **Bug 2**: Excessive exercises - rewrote exerciseSelector.ts with maxExercises limit based on minutesPerSession (~6-8 exercises per 60min session)
- **Bug 3**: Duplicate exercises - added usedExerciseIds Set to track and prevent duplicates; fixed Leg Press/Smith Squat/Machine Leg Press primaryMuscles (quads only, secondaryMuscles for glutes/hamstrings)
- **Bug 4**: Weak-point muscle labels - fixed to use selected.primaryMuscles[0] instead of day.targetMuscles[0]
- **Bug 5**: Day A/B/C variation - added dayIndex parameter to selectExercises, implemented pickByDayVariation for natural exercise rotation
- **Bug 6**: Taxingness corrections - machine exercises now 'moderate', isolation machines 'low', only heavy barbell/leg compounds are 'high'
- **Bug 7**: Home gym coverage - added 4 new dumbbell exercises (bench press, row, lateral raise, overhead press) with 'home' gymType
- **Bug 8**: Compound detection - added COMPOUND_PATTERNS constant, replaced taxingness-based detection with movement pattern matching

### Acceptance Criteria (All PASSING)
- [x] Full body 3 days returns 3 workout days
- [x] No more than 10 exercises per session (actual: 5-6 exercises)
- [x] No duplicate exercises within a session
- [x] Compound exercises cover secondary muscles (counted toward volume)
- [x] Weak-point exercises show correct target muscle
- [x] Day A and Day B have different exercises
- [x] Home gym generates 4-5+ exercises per session (actual: 5 exercises)
- [x] Taxingness correctly assigned (machines=moderate, isolations=low, compounds=high)
- [x] Compound detection uses movement pattern, not taxingness
- [x] Test script passes with reasonable output for all 3 profiles

## 2026-04-26 — Coaching Agent v1

### Phase 1: Foundation (Provider + DB)
- Delegated to: codex-implementer
- Spec: task_specs/coaching-agent-foundation.md
- Status: done
- Output: src/lib/agent/ (4 files) + supabase/migrations/005, 006
  - types.ts, provider.ts, providers/openrouter.ts, index.ts
  - coach_profiles, coach_conversations, coach_messages tables

### Phase 2: Onboarding Wizard
- Delegated to: codex-implementer
- Spec: task_specs/coaching-agent-onboarding.md
- Status: done
- Output: src/components/coach/ (6 files) + src/app/coach/page.tsx + src/app/api/coach/onboarding/route.ts
  - OnboardingWizard, BackgroundStep, GoalsStep, InjuriesStep, PreferencesStep, ReviewStep

### Phase 3: Core Agent (Orchestrator + Tools + Chat UI)
- Delegated to: codex-implementer
- Spec: task_specs/coaching-agent-core.md
- Status: done
- Output: src/lib/agent/orchestrator.ts, systemPrompt.ts, tools/ (5 files) + src/app/api/coach/chat + conversations routes + ChatInterface.tsx
  - Agentic tool-call loop with max 3 iterations
  - 4 tools: getUserProgram, getFormHistory, getExerciseInfo, getTrainingAdvice
  - Science-based system prompt (Beardsley, TNF, Mundy, Mallory, King Deltoids)

### Phase 4: Video Analysis in Chat
- Delegated to: codex-implementer
- Spec: task_specs/coaching-agent-video.md
- Status: done
- Output: src/components/coach/VideoAttachment.tsx, src/lib/agent/tools/analyzeForm.ts
  - Modified ChatInterface.tsx (attach button), chat route (evaluation field)

### Phase 5: Push Notifications
- Delegated to: codex-implementer
- Spec: task_specs/coaching-agent-notifications.md
- Status: done
- Output: public/sw.js, src/lib/agent/notifications.ts, NotificationOptIn.tsx, 2 API routes, migration 007
  - Requires VAPID keys in env (npx web-push generate-vapid-keys)
