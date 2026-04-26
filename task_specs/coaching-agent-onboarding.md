# Task: Coaching Agent Onboarding — Get-to-Know-You Wizard

## Goal
Build a multi-step onboarding wizard that collects the user's training background when they first visit the coach. Data saves to `coach_profiles` in Supabase and becomes context for all coaching conversations.

## Context
- **Existing wizard pattern:** `src/components/program/ExperienceStep.tsx` — each step gets `value`, `onChange`, `onNext` props. Card-based selection with icons. Follow this exact component pattern.
- **Design system:** `DESIGN.md` — dark gallery aesthetic (#000 bg, #E66A23 orange accent, Inter font). **Read DESIGN.md before writing any UI.**
- **DB table:** `coach_profiles` already exists (Phase 1 migration 005). Schema: `user_id`, `training_background` (JSONB), `onboarding_complete` (bool).
- **Types:** `TrainingBackground` interface in `src/lib/agent/types.ts` defines the shape we're collecting:
  ```typescript
  interface TrainingBackground {
    experienceYears: number;
    experienceLevel: 'never' | 'beginner' | 'intermediate' | 'advanced';
    primaryGoals: string[];
    trainingFrequency: number;
    injuries: string[];
    preferredEquipment: string[];
    dietApproach: string;
    additionalNotes?: string;
  }
  ```
- **Auth:** Supabase auth via `src/lib/supabase/client.ts` (client) and `server.ts` (server). User must be authenticated.
- **Supabase types:** `src/lib/supabase/database.types.ts` has the `coach_profiles` table type.

## Files to Create

### 1. `src/components/coach/OnboardingWizard.tsx` (client component)
Main wizard container managing step navigation and state.
- State: current step index + partial `TrainingBackground` object
- Steps: BackgroundStep → GoalsStep → InjuriesStep → PreferencesStep → ReviewStep
- Progress bar at top (step X of 5)
- Back/Next navigation
- On final step submit: POST to `/api/coach/onboarding`
- After success: redirect to `/coach` (the chat page, Phase 3)

### 2. `src/components/coach/steps/BackgroundStep.tsx` (client component)
Collects: `experienceLevel` and `experienceYears`
- Same card-selection UI as `ExperienceStep.tsx` in the program wizard
- 4 options: Never trained / 0-1 years / 1-3 years / 3+ years
- Maps to experienceLevel enum + approximate experienceYears number

### 3. `src/components/coach/steps/GoalsStep.tsx` (client component)  
Collects: `primaryGoals` (multi-select) and `trainingFrequency`
- Goal options (multi-select cards): Hypertrophy, Strength, Fat Loss, General Health, Athletic Performance
- Training frequency: slider or button group for 2-6 days/week

### 4. `src/components/coach/steps/InjuriesStep.tsx` (client component)
Collects: `injuries` (array of strings)
- Text input with "Add" button to add injuries
- Chip/tag display for added injuries with X to remove
- "No injuries" skip option
- Keep it simple — free text, not a body map

### 5. `src/components/coach/steps/PreferencesStep.tsx` (client component)
Collects: `preferredEquipment` (multi-select) and `dietApproach`
- Equipment options (multi-select cards): Machines, Cables, Barbells, Dumbbells, Bodyweight, Smith Machine, Bands
- Diet approach (single-select): Tracking Macros, Intuitive Eating, Not Tracking, Other
- Optional `additionalNotes` text area

### 6. `src/components/coach/steps/ReviewStep.tsx` (client component)
Summary of all collected data before submit.
- Display all selections in a clean read-only view
- "Start Coaching" primary button to submit
- Edit buttons to jump back to specific steps

### 7. `src/app/api/coach/onboarding/route.ts`
POST endpoint that:
- Authenticates user via Supabase
- Validates the `TrainingBackground` payload
- Upserts into `coach_profiles` (user_id UNIQUE constraint handles repeat submissions)
- Sets `onboarding_complete = true`
- Returns the saved profile

### 8. `src/app/coach/page.tsx` (client component — placeholder for Phase 3)
The coach landing page. For now:
- Check if user is authenticated (redirect to `/login` if not)
- Fetch `coach_profiles` for user
- If `onboarding_complete === false` or no profile: show `OnboardingWizard`
- If `onboarding_complete === true`: show placeholder "Coach chat coming soon" (Phase 3 replaces this)

## Acceptance Criteria
- [ ] 5-step wizard collects all `TrainingBackground` fields
- [ ] Follows existing wizard component pattern (value/onChange/onNext props)
- [ ] Matches DESIGN.md dark gallery aesthetic
- [ ] Data saved to `coach_profiles` table via API route
- [ ] Wizard only shown when `onboarding_complete` is false
- [ ] Upsert handles repeat visits gracefully
- [ ] Auth required — unauthenticated users redirected to `/login`
- [ ] `npm run check` passes

## Implementation Notes
- Reference `src/components/program/ExperienceStep.tsx` for the card selection pattern and SVG icon style
- Reference `src/app/program/page.tsx` for the wizard container pattern
- Use `src/lib/supabase/client.ts` for client-side Supabase calls
- Use `src/lib/supabase/server.ts` for server-side (API route) Supabase calls
- The TrainingBackground type is already defined — import from `@/lib/agent/types`
- This is UI-heavy work → delegate to Sonnet
