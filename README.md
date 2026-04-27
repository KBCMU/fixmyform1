# FixMyForm

FixMyForm is an AI-powered biomechanics app: upload lifting videos, get pose-based feedback, and use an **AI coaching agent** that remembers your background, programs, and form history.

## Features

- **Form analysis**: Client-side pose estimation (MediaPipe), deterministic scoring, and LLM-generated coaching cues (OpenRouter).
- **AI coaching agent**: Onboarding, conversational coach with tools (form history, program context, training advice), and optional web push reminders.
- **Programs & nutrition**: Periodized hypertrophy program builder; diet / macro pages (tiered product surface).
- **Accounts**: Authentication via [Clerk](https://clerk.com), with data in [Supabase](https://supabase.com) (enable the Clerk third-party provider in Supabase for JWT + RLS).
- **UI**: Dark, gallery-style layout; Tailwind CSS v4 and global design tokens.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Clerk |
| Database / BaaS | Supabase (Postgres, `@supabase/ssr` + `@supabase/supabase-js` with Clerk session tokens) |
| Pose / CV | MediaPipe Tasks Vision (browser) |
| LLM | OpenRouter (analyze, chat, coach agent) |
| Push (optional) | Web Push + VAPID |

## Getting started

```bash
npm install
```

Copy environment variables (see [`.env.example`](.env.example)) to `.env.local` and fill in values:

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and the `NEXT_PUBLIC_CLERK_SIGN_IN_*` URLs.
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; server scripts may use `SUPABASE_SERVICE_ROLE_KEY`.
- **AI**: `OPENROUTER_API_KEY` (and optional model overrides).

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Auth UI: `/sign-in`.

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run check` | Build + `tsc` |
| `npm run import-exercises` | Import exercises (see `scripts/`) |
| `npm run process-reference-videos` | Reference video / pose pipeline |

### Deployment (optional)

Cloudflare-oriented scripts: `npm run deploy`, `npm run preview` (see `package.json` and OpenNext + Wrangler setup).

## Project structure

- `src/app` — Routes, API route handlers (`/api/analyze`, `/api/chat`, `/api/coach/*`, `/api/program/*`, etc.).
- `src/components` — Layout, marketing, form analysis, coach UI.
- `src/lib` — Pose logic, Supabase clients, agent (orchestrator, tools, OpenRouter provider), R2/storage helpers.
- `src/contexts` — App auth context (Clerk-backed).
- `supabase/migrations` — SQL migrations for coach profiles, conversations, push subscriptions, etc.
- `scripts/` — TypeScript utilities for data import and media processing.

## License

All Rights Reserved.
