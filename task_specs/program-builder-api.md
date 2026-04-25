# Task: Program Builder API Route + LLM Integration

## Goal
Create the API route `POST /api/program/generate` that receives a user profile, generates a hypertrophy program using the rules engine, enhances it with LLM intelligence (weak-point adjustments + program explanation), and returns the complete program. Also create `POST /api/program/save` to persist programs to Supabase.

## Context
- Project: Next.js 15 (App Router) + TypeScript
- Rules engine already exists at `src/lib/programBuilder/programAssembler.ts` — exports `generateProgram(profile: UserProfile): GeneratedProgram`
- Existing OpenRouter pattern: `src/app/api/analyze/route.ts` — follow this pattern for the LLM call
- Auth: Supabase auth via `@supabase/ssr` — see `src/app/dashboard/page.tsx` for server-side auth check pattern
- Types: `src/lib/programBuilder/types.ts` — all types are defined there
- OpenRouter API key: `process.env.OPENROUTER_API_KEY`
- OpenRouter URL: `https://openrouter.ai/api/v1/chat/completions`

## Files to Create

### 1. `src/app/api/program/generate/route.ts`

```typescript
// POST /api/program/generate
// Input: UserProfile (JSON body)
// Output: GeneratedProgram with LLM explanation
// Auth: Required — check Supabase session
```

Steps:
1. **Auth check**: Use Supabase server client to verify the user is authenticated. Return 401 if not.
   ```typescript
   import { createClient } from '@/lib/supabase/server';
   // Check if server client exists — if not, use the pattern from the existing codebase
   ```
   If there's no server Supabase client helper, check auth by looking at how `src/app/dashboard/page.tsx` does it and replicate that pattern for an API route (using `cookies()` from `next/headers`).

2. **Validate input**: Parse body as `UserProfile`. Validate required fields (experience, daysPerWeek, minutesPerSession, gymType, selectedSplit). Return 400 if invalid.

3. **Generate program**: Call `generateProgram(profile)` from `src/lib/programBuilder/programAssembler.ts`. This is the deterministic rules engine — it returns a full `GeneratedProgram`.

4. **LLM enhancement** (if user has weak points OR always for the explanation):
   - Call OpenRouter with a prompt asking it to:
     a. Review the generated program for the user's weak points and suggest any exercise swaps that better target those weak areas (from the exercise catalog alternatives)
     b. Write a 2-3 sentence explanation of why this program is structured the way it is
   - Model: Use `process.env.OPENROUTER_MODEL` or default to a cheap/fast model like `qwen/qwen3-8b` (this is text-only, no vision needed)
   - If LLM call fails, return the program anyway without the explanation (graceful degradation)

5. **Return**: The `GeneratedProgram` JSON with the `explanation` field populated.

LLM Prompt structure:
```
System: You are a hypertrophy training specialist. You follow evidence-based principles.
Volume guidelines: beginners 6-12 sets/muscle/week, intermediate 5-10, advanced 3-9.
You do NOT follow Mike Israetel's volume landmarks.

User: Here is a generated hypertrophy program for a user with the following profile:
[JSON profile]

The program has these workouts:
[JSON workouts — just exercise names, sets, reps per day]

{If weak points exist:}
The user wants to prioritize these weak areas: [weak points list]
Review the exercise selection and suggest if any exercises should be swapped for better weak-point targeting. Only suggest swaps from these alternatives: [list alternatives from ExerciseSlot.alternatives]

Write a 2-3 sentence explanation of why this program is structured the way it is for this user.
Respond in JSON: { "explanation": "...", "swaps": [{ "day": "...", "slotId": "...", "swapToExerciseId": "..." }] }
```

### 2. `src/app/api/program/save/route.ts`

```typescript
// POST /api/program/save
// Input: { name: string, program: GeneratedProgram }
// Output: { id: string }
// Auth: Required
```

Steps:
1. **Auth check**: Same as generate route
2. **Validate**: Ensure `name` and `program` are present
3. **Save to Supabase**: Insert into `user_programs` table
   - If this table doesn't exist yet, create the insert using the Supabase client and handle the error gracefully (return a helpful error message saying the table needs to be created)
   - Fields: `user_id` (from auth), `name`, `profile` (JSONB), `program_data` (JSONB), `llm_explanation` (text)
4. **Return**: `{ id: <generated UUID> }`

### 3. `supabase/migrations/004_user_programs.sql`

Create the `user_programs` table:
```sql
CREATE TABLE user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  profile JSONB NOT NULL,
  program_data JSONB NOT NULL,
  llm_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own programs"
  ON user_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own programs"
  ON user_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
  ON user_programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
  ON user_programs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_programs_user_id ON user_programs(user_id);
```

## Acceptance Criteria
- [ ] `POST /api/program/generate` returns a valid `GeneratedProgram` JSON
- [ ] Auth is checked — returns 401 for unauthenticated requests
- [ ] Input validation returns 400 for missing fields
- [ ] Rules engine `generateProgram()` is called correctly
- [ ] LLM call to OpenRouter works and adds `explanation` field
- [ ] LLM failure is handled gracefully (program returned without explanation)
- [ ] `POST /api/program/save` persists to Supabase and returns the ID
- [ ] Migration SQL is valid and includes RLS policies
- [ ] No security vulnerabilities (no SQL injection, auth properly checked)

## Implementation Notes
- Follow the exact OpenRouter call pattern from `src/app/api/analyze/route.ts` (headers, error handling, etc.)
- The Supabase server client pattern may vary — check existing code for how it's created in API routes vs server components
- Keep the LLM prompt focused — we want a quick, cheap call, not a long reasoning chain
- Do NOT use the Anthropic SDK here — use OpenRouter for consistency with the existing API routes
