# Task: Program Builder Wizard UI

## Goal
Build a multi-step wizard at `/program/new` that collects user information for hypertrophy program generation. This is the intake questionnaire — it does NOT generate the program itself (that's a separate API task).

## Context
- Project: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Design system: "Museum Gallery Palette" — pure black backgrounds, warm orange/amber accents, semi-transparent borders
- Existing wizard pattern: `src/app/form/page.tsx` — 4-step wizard with progress bar. Follow this pattern closely.
- Auth context: `src/contexts/AuthContext.tsx` — provides `useAuth()` hook with `{ user, loading }`
- All components must be client components (`"use client"`)

## Design System Tokens (from DESIGN.md)
```
Backgrounds:  #000000 (primary), #050505 (secondary), #0A0A0A (card), #0F0F0F (elevated)
Text:         #FFFFFF (primary), #AAAAAA (secondary), #666666 (muted)
Accents:      #E66A23 (orange, primary CTA), #D1834B (amber), #E2B28B (warm)
Borders:      rgba(255,255,255,0.08) (subtle), rgba(255,255,255,0.25) (active)
Status:       #EF4444 (danger), #F59E0B (warning), #22C55E (success)
Teal:         #0D9488 (interactive highlights)
Lime:         #84CC16 (action buttons)
Border radius: 2-4px (sharp, engineered look — NOT rounded)
Fonts:        Inter (sans), Cormorant Garamond (serif display), Geist Mono (mono)
Elevation:    Tonal layers + ambient glows, NO box-shadows
```

## Files to Create

### 1. `src/app/program/new/page.tsx`
Main wizard page. Follow the pattern in `src/app/form/page.tsx`:
- Progress bar at top (animated width based on currentStep)
- Numbered step circles (completed = checkmark, current = highlighted, future = grayed)
- Page transitions with opacity/translateY animations
- Steps array with labels

Steps (7 total):
```typescript
const STEPS = [
  { step: 1, label: "Experience", id: "experience" },
  { step: 2, label: "Schedule", id: "schedule" },
  { step: 3, label: "Location", id: "location" },
  { step 4, label: "Weak Points", id: "weak-points" },  // CONDITIONAL: only shown if experience === 'advanced'
  { step: 5, label: "Split", id: "split" },
  { step: 6, label: "Sign Up", id: "auth" },            // CONDITIONAL: only shown if not logged in
  { step: 7, label: "Generate", id: "generate" },
];
```

**Important**: Steps 4 and 6 are conditional. When they're skipped, the progress bar and step circles should adjust (fewer total steps shown). Use a computed `activeSteps` array.

State management: Use a single `useState<Partial<UserProfile>>` to accumulate answers across steps. Each step component receives the profile state and an `onUpdate` callback.

The "Generate" step (last step) should POST to `/api/program/generate` with the completed profile and show a loading state while waiting.

### 2. `src/components/program/ExperienceStep.tsx`

Four large selectable cards in a 2x2 grid:

| Card | Label | Subtitle |
|------|-------|----------|
| 1 | Never trained | "I'm completely new to the gym" |
| 2 | 0-1 years | "I've been training for less than a year" |
| 3 | 1-3 years | "I have some solid experience" |
| 4 | 3+ years | "I'm an experienced lifter" |

Each card:
- Background: `var(--bg-card)` (#0A0A0A)
- Border: `rgba(255,255,255,0.08)`, changes to `var(--accent-orange)` (#E66A23) when selected
- Subtle scale transform on hover (1.02)
- Check icon appears when selected
- Border-radius: 4px

Props: `{ value: ExperienceLevel | undefined, onChange: (level: ExperienceLevel) => void }`

"Next" button at bottom — disabled until selection made. Styled with `var(--accent-orange)` background.

### 3. `src/components/program/ScheduleStep.tsx`

Two sections:

**Days per week**: Row of 5 selectable chips (2, 3, 4, 5, 6)
- Each chip: pill-shaped, `var(--bg-card)` bg, `var(--border-subtle)` border
- Selected: `var(--accent-orange)` border + subtle orange bg tint

**Time per session**: Row of 5 selectable chips (30min, 45min, 60min, 75min, 90min+)
- Same styling as days chips

Section labels in `var(--text-secondary)` (#AAAAAA), uppercase, small tracking (like label-mono style).

Props: `{ daysPerWeek?: number, minutesPerSession?: number, onChange: (field: string, value: number) => void }`

### 4. `src/components/program/LocationStep.tsx`

Three selectable cards (vertical stack or horizontal row on desktop):

| Card | Label | Description | Icon suggestion |
|------|-------|-------------|-----------------|
| 1 | Commercial Gym | "Full access to machines, cables, and free weights" | Building icon |
| 2 | Home Gym | "Dumbbells, bench, and basic equipment" | Home icon |
| 3 | Hotel / Travel | "Minimal equipment, bodyweight focus" | Suitcase icon |

Same card styling as ExperienceStep.

Props: `{ value: GymType | undefined, onChange: (type: GymType) => void }`

### 5. `src/components/program/WeakPointsStep.tsx`

**Only shown if experience === 'advanced' (3+ years)**

Two-phase selection:

**Phase 1**: Select muscle regions (multi-select). Show 5 cards:
- Chest, Back, Shoulders, Arms, Legs

**Phase 2**: For selected regions that have sub-regions, show drill-down options:
- Chest → Upper / Lower / Overall
- Back (Lats) → Upper / Lower
- Shoulders → Front Delts / Lateral Delts / Rear Delts
- Arms > Triceps → Long Head / Medial+Lateral
- Arms > Biceps → Brachialis / Long+Short Head
- Legs → no sub-regions (skip drill-down)

Sub-region cards appear below the parent region with a subtle indent or connecting visual.

The output should be an array of `MuscleBias` strings. If user selects a top-level region without sub-regions, or selects "Overall", it maps to general priority for that muscle.

This step is optional — user can skip if they don't have specific weak points.

Props: `{ weakPoints: MuscleBias[], onChange: (points: MuscleBias[]) => void }`

### 6. `src/components/program/SplitStep.tsx`

Display 2-4 split options based on `daysPerWeek` from the profile:

```
2-3 days → Full Body
4 days   → Full Body EOD, Upper/Lower 2x, Anterior/Posterior 2x
5 days   → UL rest repeat, AP rest repeat, UL+PPL
6 days   → UL 3x, AP 3x
```

Each split shown as a card with:
- Split name (large text)
- Brief description of the structure
- Badge: "Recommended" for Full Body EOD/3x, UL or AP rest repeat
- Weekly schedule preview (e.g., "Mon: Upper | Tue: Lower | Wed: Rest | ...")

Selected card gets orange border.

Props: `{ daysPerWeek: number, selectedSplit?: SplitType, onChange: (split: SplitType) => void }`

### 7. `src/components/program/AuthGate.tsx`

**Only shown if user is NOT logged in** (check via `useAuth()` hook)

Clean sign-up/sign-in prompt:
- Headline: "Sign in to generate your program" (serif font — Cormorant)
- Subtitle: "Your answers are saved. Create an account to get your personalized hypertrophy program."
- Two buttons: "Sign Up" (primary, orange bg) and "Sign In" (secondary, border only)
- Both link to `/signup` and `/login` respectively, with a `?redirect=/program/new` query param so user returns after auth

Props: none (self-contained, uses `useAuth()`)

### 8. `src/components/program/GenerateStep.tsx`

The final step that triggers program generation:
- Summary of user's selections (experience, schedule, location, split, weak points if any)
- "Generate My Program" button (large, `var(--accent-orange)` bg, prominent)
- On click: POST to `/api/program/generate` with the full `UserProfile`
- Loading state: show animated progress with message "Building your hypertrophy program..."
- On success: receive the `GeneratedProgram` and either navigate to a results view or render inline

Props: `{ profile: UserProfile, onGenerated: (program: GeneratedProgram) => void }`

## Type Imports

The wizard components need these types. Since the programBuilder types may not exist yet when this UI is built, **define a local types file** at `src/components/program/types.ts` with the same interfaces. We'll consolidate later.

Key types needed:
```typescript
type ExperienceLevel = 'never' | 'beginner' | 'intermediate' | 'advanced';
type GymType = 'commercial' | 'home' | 'hotel';
type SplitType = 'full_body' | 'upper_lower' | 'anterior_posterior' | 'push_pull_legs' | 'upper_lower_ppl';
type MuscleBias = 'chest_upper' | 'chest_lower' | 'chest_overall' | 'lats_upper' | 'lats_lower' | 'delts_front' | 'delts_lateral' | 'delts_rear' | 'triceps_long' | 'triceps_medial_lateral' | 'biceps_brachialis' | 'biceps_long_short';

interface UserProfile {
  experience: ExperienceLevel;
  daysPerWeek: number;
  minutesPerSession: number;
  gymType: GymType;
  weakPoints?: MuscleBias[];
  selectedSplit: SplitType;
}
```

## Acceptance Criteria
- [ ] Wizard renders at `/program/new` with progress bar and step navigation
- [ ] Each step collects its data and enables "Next" only when valid
- [ ] "Back" button works on all steps (returns to previous)
- [ ] Weak Points step only appears for 3+ years experience
- [ ] Auth Gate step only appears for non-authenticated users
- [ ] Progress bar and step circles adjust for conditional steps
- [ ] All components follow the Museum Gallery design system (dark theme, orange accents, 2-4px radius, no shadows)
- [ ] Responsive: works on mobile (single column) and desktop (wider cards)
- [ ] Generate step shows loading state and calls the API

## Implementation Notes
- Reference the existing wizard at `src/app/form/page.tsx` for the step management pattern
- Use inline styles with CSS variables (like existing components do) for theming
- Do NOT use any external UI library (no shadcn, no MUI, etc.)
- Use SVG icons inline (no icon library) — keep them simple
- Animations: use CSS transitions (opacity, transform) for step changes, not framer-motion
