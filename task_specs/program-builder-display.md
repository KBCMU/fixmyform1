# Task: Program Display View + Exercise Swapping

## Goal
Build the program display UI that renders a generated hypertrophy program as a weekly view with expandable exercise cards and exercise swapping functionality. This is what the user sees after their program is generated.

## Context
- Project: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Design system: "Museum Gallery Palette" — pure black backgrounds, warm orange/amber accents, semi-transparent borders
- Types: Import from `@/lib/programBuilder/types` — key types are `GeneratedProgram`, `WorkoutDay`, `ExerciseSlot`, `CatalogExercise`
- The wizard at `/program/new` calls `onGenerated(program)` which currently does `router.push(/program/${program.id})`
- Auth context: `src/contexts/AuthContext.tsx` — `useAuth()` hook

## Design System Tokens
```
Backgrounds:  #000000 (primary), #050505 (secondary), #0A0A0A (card), #0F0F0F (elevated)
Text:         #FFFFFF (primary), #AAAAAA (secondary), #666666 (muted)
Accents:      #E66A23 (orange CTA), #D1834B (amber), #E2B28B (warm)
Borders:      rgba(255,255,255,0.08) (subtle), rgba(255,255,255,0.25) (active)
Teal:         #0D9488 (interactive)
Lime:         #84CC16 (action buttons)
Border radius: 2-4px
Fonts:        Inter (sans), Cormorant Garamond (serif display), Geist Mono (mono)
No box-shadows — use tonal layers
```

## Key Type Shapes (from `src/lib/programBuilder/types.ts`)

```typescript
interface GeneratedProgram {
  id?: string;
  profile: UserProfile;
  split: SplitDefinition;
  workouts: WorkoutDay[];
  explanation?: string;
  createdAt?: string;
}

interface WorkoutDay {
  dayName: string;
  exercises: ExerciseSlot[];
}

interface ExerciseSlot {
  id: string;
  selectedExercise: CatalogExercise;
  alternatives: CatalogExercise[];
  sets: number;
  repRange: [number, number];
  targetMuscle: MuscleGroup;
  movementPattern: MovementPattern;
  orderPriority: number;
}

interface CatalogExercise {
  id: string;
  name: string;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  muscleBias?: MuscleBias;
  lengthTension?: LengthTension;
  equipment: Equipment[];
  taxingness: Taxingness;
  techniqueCues: string[];
  referenceVideoUrl?: string;
  referenceVideoCredit?: string;
}
```

## Files to Create

### 1. `src/app/program/[id]/page.tsx`

The saved program view page. For MVP:
- This page receives the program data. Since the save API might not exist yet, support TWO modes:
  a. If `id` param is a valid UUID → fetch from Supabase (future)
  b. If the program was just generated → receive it via URL state or a shared context
- For now, use a simple approach: store the generated program in `sessionStorage` when navigating from the wizard, and read it here. Fall back to a "Program not found" state.
- Render the `ProgramView` component with the program data.
- Include a "Save Program" button that calls `POST /api/program/save` (or shows a placeholder if API isn't ready)

### 2. `src/components/program/ProgramView.tsx`

Main container component. Layout:

```
┌────────────────────────────────────────┐
│ Program header                         │
│ Split name + explanation               │
├────────────────────────────────────────┤
│ [Day 1 tab] [Day 2 tab] [Day 3 tab].. │
├────────────────────────────────────────┤
│ Exercise 1: Lat Pulldown     3×8-12   │
│ Exercise 2: Seated Cable Row 3×8-12   │
│ Exercise 3: Cable Curl       2×10-15  │
│ ...                                    │
└────────────────────────────────────────┘
```

Features:
- **Header section**: Program name (serif font), split type badge, LLM explanation text (if available)
- **Day tabs**: Horizontal scrollable tabs for each workout day. Active tab has orange bottom border. Rest days shown grayed out.
- **Exercise list**: Renders `ExerciseCard` for each exercise in the selected day
- **Actions**: "Save Program" button (lime/orange), "Edit Selections" button (secondary, goes back to wizard)

Props: `{ program: GeneratedProgram, onSave?: (name: string) => void, editable?: boolean }`

State: Track which day tab is selected, and track exercise swaps (maintain a local copy of the program with swapped exercises).

### 3. `src/components/program/ExerciseCard.tsx`

Individual exercise slot with **progressive disclosure**:

**Collapsed state** (default):
```
┌──────────────────────────────────────┐
│ 1. Lat Pulldown            3 × 8-12 │
│    ▸ Cable, Back                     │
└──────────────────────────────────────┘
```
- Exercise number + name (left)
- Sets × rep range (right, mono font)
- Small subtitle: equipment type + target muscle (muted text)
- Click/tap anywhere to expand

**Expanded state**:
```
┌──────────────────────────────────────┐
│ 1. Lat Pulldown            3 × 8-12 │
│    Cable · Back · Vertical Pull      │
│                                      │
│  Target Muscle    Back (Lats)        │
│  Movement         Vertical Pull      │
│  Equipment        Cable              │
│  Bias             Lats - Upper       │
│                                      │
│  Technique Cues                      │
│  • Pull elbows down and back         │
│  • Full stretch at top               │
│  • Squeeze at bottom                 │
│                                      │
│  🎬 Reference Video                  │
│  [YouTube/IG embed or placeholder]   │
│                                      │
│  ┌─ Swap Exercise ─────────────────┐ │
│  │ ▾ Lat Pulldown (current)        │ │
│  │   Underhand Lat Pulldown        │ │
│  │   Cable Pullover                │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

Details shown on expand:
- Target muscle + movement pattern + equipment (label-mono style)
- Muscle bias and length-tension if available
- Technique cues (bullet list)
- Reference video embed (YouTube/Instagram iframe) or "No reference video yet" placeholder
- **Swap dropdown**: Shows current exercise + alternatives. Selecting an alternative swaps the exercise in the slot.

Props:
```typescript
{
  slot: ExerciseSlot;
  index: number;
  onSwap: (slotId: string, newExercise: CatalogExercise) => void;
  editable?: boolean;  // show swap dropdown only if true
}
```

Styling:
- Card bg: `#0A0A0A`, border: `rgba(255,255,255,0.08)`
- Expanded: bg changes to `#0F0F0F` (elevated)
- Exercise number: orange accent color
- Sets × reps: mono font, `var(--text-secondary)`
- Technique cues: small text, bullet with teal dots
- Expand/collapse: smooth height transition (CSS `max-height` or `grid-template-rows: 0fr/1fr`)
- Swap dropdown: styled select with dark bg, subtle border, teal highlight on focus

### 4. `src/components/program/WeekView.tsx`

Day tab bar component:

- Horizontal scrollable row of tab buttons
- Each tab shows: day name (e.g., "Day 1 - Upper A")
- Rest days: dimmed, not clickable, marked with "Rest" label
- Active tab: bottom border in `#E66A23`, text white
- Inactive tab: text `#666666`, no border
- On mobile: horizontally scrollable with hidden scrollbar

Props: `{ workouts: WorkoutDay[], selectedDay: number, onSelectDay: (index: number) => void }`

## Acceptance Criteria
- [ ] Program view renders all workout days with correct exercises
- [ ] Day tabs switch between workout days
- [ ] Exercise cards show collapsed state by default
- [ ] Clicking expands to show full details (target, cues, video, swap)
- [ ] Exercise swap dropdown shows alternatives and swapping works
- [ ] Reference video embeds render for exercises that have URLs
- [ ] "No reference video" placeholder shown for exercises without URLs
- [ ] Design matches Museum Gallery aesthetic (dark, orange accents, sharp corners)
- [ ] Responsive layout (mobile-friendly)
- [ ] The `/program/[id]` page loads program from sessionStorage

## Implementation Notes
- Reference existing components (`ExerciseSelector.tsx`, `FeedbackDisplay.tsx`) for styling patterns
- Use inline styles with CSS variables (existing pattern in this codebase)
- NO external UI libraries
- For video embeds: use iframe with YouTube/Instagram embed URL. Wrap in a 16:9 aspect ratio container.
- The swap functionality should be client-side only — it updates the local state, the save API persists the final version
- For the expand/collapse animation, prefer `grid-template-rows` trick or CSS transitions on `max-height`
