# (FYI Codex will be reviewing your code and plans)

## Project Overview
FixMyForm is an AI-powered biomechanics analysis web application that helps users perfect their lifting technique. It uses MediaPipe for client-side pose estimation and Claude (Anthropic) for providing intelligent, actionable coaching feedback on video uploads.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend/DB**: Supabase & Cloudflare Workers (OpenNextJS)
- **AI/ML**: MediaPipe Vision & Openrouter AI models

## Architecture
- `src/app`: Next.js App Router and global configuration
- `src/components`: Reusable UI components (VideoUpload, PoseVisualization, etc.)
- `src/lib`: Core logic, including exercise definitions, geometry helpers, and AI coaching integration
- `src/agents` & `src/workflows`: AI integration and processing pipelines
- `supabase/`: Database configuration and Edge Functions
- `scripts/`: Data import and setup scripts

## Coding Rules
- Use functional React components
- Prefer server components where interactivity is not required
- Use Tailwind utilities; avoid custom CSS where possible
- Follow strict TypeScript typing

## Design System
- **CRITICAL: ALWAYS refer to `DESIGN.md` for design tokens, colors, typography, and specific rules before doing any Frontend or UI/UX work.**
- Clean, modern, minimalist aesthetic (like a high-end photography gallery)
- Direct styling with Tailwind CSS v4, utilizing global CSS variables when needed

## Commands
- `npm run dev`: Start local development server
- `npm run build`: Build the Next.js application
- `npm run check`: Run build and typecheck
- `npm run deploy`: Deploy to Cloudflare using OpenNextJS

# Project Orchestration Rules

## Codebase Index
Pre-built index files are in `.ai-codex/`. Read these FIRST before exploring the codebase:
- `.ai-codex/routes.md` -- all API routes
- `.ai-codex/pages.md` -- page tree
- `.ai-codex/lib.md` -- library exports
- `.ai-codex/schema.md` -- database schema
- `.ai-codex/components.md` -- component tree

## Your Role(for Opus): Planner & Orchestrator Only

You are the **strategic brain** of this project. You plan, delegate, and verify.
You do NOT write implementation code yourself — that wastes your context on Pro limits.

---

## Core Workflow

```
1. UNDERSTAND   → Clarify requirements with the user
2. PLAN         → Write a detailed spec to task_specs/<task-name>.md
3. DELEGATE     → Hand the spec to the right subagent
4. VERIFY       → Review output at a high level, flag issues
5. LOG          → Update progress.md
```

---

## Delegation Rules

**Always use `@agent-implementation-router` first.** Never route directly to an implementer yourself — the router scores the task and decides.

The router will choose between:

| Subagent                    | When                                              |
|-----------------------------|---------------------------------------------------|
| `@agent-codex-implementer`       | Complex logic, security-sensitive, needs sandboxed testing |
| `@agent-openrouter-implementer`  | Refactors, standard features, quick fixes, Codex rate-limited |

The router also selects the specific OpenRouter model (qwen3-8b / qwen3-30b / deepseek-coder-v2).

**Never implement code inline in this session unless the change is < 5 lines.**

---

## Writing Task Specs

Before delegating, always write a spec file to `task_specs/<task-name>.md`:

```markdown
# Task: <name>

## Goal
One sentence summary of what needs to be done.

## Context
- Relevant files: src/...
- Related types/interfaces: ...
- Constraints: must not break X, must use Y pattern

## Acceptance Criteria
- [ ] criterion 1
- [ ] criterion 2

## Implementation Notes
Any hints, patterns to follow, existing code to reference.
```

Then hand the spec path to the subagent.

---

## Progress Tracking

Keep `progress.md` updated after every delegation:

```
## <date> — <task-name>
- Delegated to: codex-implementer
- Spec: task_specs/<name>.md
- Status: in-progress | done | needs-review
- Output files: src/...
- Notes: ...
```

---

# Lessons Learned

Fill this section when you make a mistake or when you discover something important about the codebase.

- When user want us to write tests, we should write tests
- When user ask for a feature, we should write tests for it

# Final Notes

- Don't waste tokens.
- Don't stop at "good enough", always aim for the best solution, don't wrap things up early or "go to sleep".
- Always double check your work.
- Don't be afraid to ask for help, in fact I encourage you to when needed.