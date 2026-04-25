# Task: Program Builder API Routes Implementation

## Goal
Create two API routes (`POST /api/program/generate` and `POST /api/program/save`) that generate hypertrophy training programs using the rules engine and OpenRouter LLM, then persist them to Supabase with RLS protection.

## Context

### Existing Patterns in Codebase
1. **Supabase Auth**: Use `createClient()` from `@/lib/supabase/server` (which is an async function that returns a server-side Supabase client)
2. **OpenRouter API calls**: See `src/app/api/analyze/route.ts` for exact pattern:
   - API key from `process.env.OPENROUTER_API_KEY`
   - URL: `https://openrouter.ai/api/v1/chat/completions`
   - Headers: `Content-Type`, `Authorization`, `HTTP-Referer`, `X-Title`
   - Body structure with messages array
3. **Rules Engine**: `generateProgram(profile: UserProfile)` from `src/lib/programBuilder/programAssembler.ts`
4. **Types**: All from `src/lib/programBuilder/types.ts` (UserProfile, GeneratedProgram, ExerciseSlot, etc.)
5. **Supabase Server Client**: `createClient()` is async, returns authenticated client
6. **Auth pattern in route handlers**: Check user via `supabase.auth.getUser()`, return 401 if not authenticated

### Key Files
- src/app/api/analyze/route.ts — OpenRouter pattern reference
- src/app/dashboard/page.tsx — Supabase auth pattern in server components
- src/lib/supabase/server.ts — Supabase client factory
- src/lib/programBuilder/programAssembler.ts — generateProgram() function
- src/lib/programBuilder/types.ts — all type definitions
- supabase/migrations/004_user_programs.sql — database migration (needs to be created)

### Database Setup
The `user_programs` table will have:
- id (UUID, PK)
- user_id (UUID, FK to auth.users, cascading delete)
- name (TEXT)
- profile (JSONB) — the UserProfile object
- program_data (JSONB) — the GeneratedProgram workouts
- llm_explanation (TEXT) — the explanation from LLM
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

RLS policies must restrict users to their own programs.

## Acceptance Criteria
- [ ] `POST /api/program/generate` accepts UserProfile in request body
- [ ] Auth is properly checked — returns 401 for unauthenticated requests
- [ ] Input validation returns 400 for missing required fields (experience, daysPerWeek, minutesPerSession, gymType, selectedSplit)
- [ ] `generateProgram()` is called and returns valid GeneratedProgram
- [ ] OpenRouter LLM is called with correct API key, URL, and message structure
- [ ] LLM prompt includes user profile, program workouts, and weak points if present
- [ ] LLM response is parsed and `explanation` field is added to GeneratedProgram
- [ ] If LLM fails, program is returned without explanation (graceful degradation)
- [ ] `POST /api/program/save` accepts `{ name: string, program: GeneratedProgram }` in request body
- [ ] Save route checks auth and validates input
- [ ] Program is inserted into `user_programs` table with user_id from auth
- [ ] Save route returns `{ id: <uuid> }`
- [ ] Migration creates `user_programs` table with proper schema, RLS policies, and index
- [ ] All code follows TypeScript strict mode
- [ ] No security vulnerabilities (auth always checked before DB access)

## Implementation Notes

### File 1: src/app/api/program/generate/route.ts

Follow this structure:
1. Import NextRequest, NextResponse, types, Supabase client, generateProgram
2. Export POST handler
3. Auth check using `createClient()` and `getUser()`
4. Input validation for UserProfile fields
5. Call `generateProgram(profile)`
6. Call OpenRouter with LLM prompt (see structure below)
7. Parse LLM response and extract explanation
8. Add explanation to GeneratedProgram
9. Return as JSON
10. Catch errors and return 500 with helpful message

### LLM Prompt for /api/program/generate
```
System: You are a hypertrophy training specialist who follows evidence-based principles. 
Volume guidelines: beginners 6-12 sets/muscle/week, intermediate 5-10, advanced 3-9.

User: I generated a hypertrophy program for a user with this profile:
[PROFILE JSON]

The program has these workouts:
[WORKOUTS SUMMARY - just day name and exercise names]

{If weak points exist:}
The user's weak points are: [weak points]
Review if any exercises should be swapped to better target these weak areas.
Only suggest swaps from the listed alternatives.

Respond in JSON format:
{
  "explanation": "2-3 sentence explanation of why this program is structured this way",
  "swaps": []
}
```

Model: Use `process.env.OPENROUTER_MODEL` or default to `qwen/qwen3-8b`
Max tokens: 512 (text-only, no vision)
Temperature: 0.5

### File 2: src/app/api/program/save/route.ts

Follow this structure:
1. Import NextRequest, NextResponse, types, Supabase client
2. Export POST handler
3. Auth check using `createClient()` and `getUser()`
4. Input validation (name and program required)
5. Call `supabase.from('user_programs').insert()` with:
   - user_id from auth.user.id
   - name
   - profile: JSON.stringify(program.profile)
   - program_data: JSON.stringify({ workouts: program.workouts, split: program.split })
   - llm_explanation: program.explanation or null
6. Return inserted record's ID
7. If table doesn't exist, return 400 with message asking to run migrations
8. Catch errors and return appropriate status

### File 3: supabase/migrations/004_user_programs.sql

Create the migration file with:
- CREATE TABLE user_programs with all required columns
- ALTER TABLE to enable RLS
- CREATE POLICY for SELECT (users can view their own)
- CREATE POLICY for INSERT (users can insert their own)
- CREATE POLICY for UPDATE (users can update their own)
- CREATE POLICY for DELETE (users can delete their own)
- CREATE INDEX on (user_id)

See the spec task_specs/program-builder-api.md for exact SQL.

## Key Implementation Details

### Auth Pattern
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Input Validation
Check these fields in UserProfile:
- experience (required, must be 'never'|'beginner'|'intermediate'|'advanced')
- daysPerWeek (required, 2-6)
- minutesPerSession (required, 30-90)
- gymType (required, 'commercial'|'home'|'hotel')
- selectedSplit (required, valid split type)

### OpenRouter Call Pattern
Same as src/app/api/analyze/route.ts:
- Fetch to `https://openrouter.ai/api/v1/chat/completions`
- POST with JSON body
- Headers: Content-Type, Authorization (Bearer token), HTTP-Referer, X-Title
- Expect response.choices[0].message.content
- Handle non-200 status codes
- Parse JSON response with try-catch fallback

### Error Handling
- 400: Invalid input, missing fields, invalid enum values
- 401: Not authenticated
- 500: OpenRouter API failure, Supabase insert failure, other server errors
- Always include helpful error messages

### LLM Graceful Degradation
If OpenRouter call fails, still return the GeneratedProgram from the rules engine without the explanation field populated. Log the error but don't block the response.

## Testing Note
After implementation, verify:
1. Send POST to /api/program/generate with valid UserProfile — should return GeneratedProgram
2. Send POST to /api/program/generate without auth — should return 401
3. Send POST to /api/program/generate with invalid profile — should return 400
4. Send POST to /api/program/save with valid program and auth — should return { id: "..." }
5. Query Supabase user_programs table — should only return own user's programs (RLS)
