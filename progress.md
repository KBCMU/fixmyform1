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
