---
name: implementation-router
description: ALWAYS load this skill before delegating any implementation task. Provides routing logic to determine which implementer subagent to use based on task complexity, type, and current constraints.
---

# Implementation Routing Skill

When the orchestrator needs to delegate an implementation task, follow this skill to
decide which subagent handles it. Never skip this routing step.

---

## Step 1 — Score the Task

Evaluate the task across these dimensions and assign a complexity score:

| Dimension                        | Low (1)                        | Medium (2)                       | High (3)                          |
|----------------------------------|--------------------------------|----------------------------------|-----------------------------------|
| **File scope**                   | 1–2 files                      | 3–6 files                        | 7+ files or codebase-wide         |
| **Logic complexity**             | Straightforward CRUD / UI      | Business logic, state management | Algorithms, concurrency, perf     |
| **Type system depth**            | Simple types / props           | Generics, utility types          | Complex inference, conditional types |
| **External integrations**        | None                           | 1 API / library                  | Multiple or unfamiliar APIs       |
| **Risk of regression**           | Isolated feature               | Touches shared utilities         | Core infrastructure               |

Sum the scores (5–15).

---

## Step 2 — Choose the Implementer

```
Score 5–7   → openrouter-implementer  (use qwen/qwen3-8b for speed)
Score 8–11  → openrouter-implementer  (use qwen/qwen3-30b or deepseek-coder-v2)
Score 12–15 → codex-implementer       (gpt-5.4 — best reasoning for hard tasks)
```

### Override Rules (check these first, they take priority)

| Condition                                        | Force Route To              |
|--------------------------------------------------|-----------------------------|
| Task requires running/testing code in a sandbox  | `codex-implementer`         |
| Task is security-sensitive (auth, crypto, perms) | `codex-implementer`         |
| Codex is rate-limited (user said so)             | `openrouter-implementer`    |
| Task is pure refactor (no new logic)             | `openrouter-implementer` (qwen3-30b) |
| Task is a quick isolated bug fix (< 20 lines)   | `openrouter-implementer` (qwen3-8b)  |
| User explicitly requested a model               | Honor the request           |

---

## Step 3 — Select the OpenRouter Model (if routing there)

When using `openrouter-implementer`, specify the model in your delegation:

| Use Case                              | Model                              |
|---------------------------------------|------------------------------------|
| Quick fix, isolated change            | `qwen/qwen3-8b` (fast, free)      |
| Standard feature, moderate complexity | `qwen/qwen3-30b` (capable, free)  |
| Large refactor, multi-file            | `deepseek/deepseek-coder-v2`       |
| When unsure                           | `qwen/qwen3-30b`                   |

Pass the model as a note in your delegation prompt so the subagent picks it up.

---

## Step 4 — Delegation Message Format

When invoking the chosen subagent, always include:

```
Spec file: task_specs/<name>.md
Routing rationale: <1 sentence — why this subagent/model>
Suggested model: <model string if using openrouter>
Priority: high | normal | low
```

---

## Step 5 — Fallback Chain

If the primary implementer fails or is unavailable:

```
codex-implementer fails → openrouter-implementer (qwen/qwen3-30b)
openrouter-implementer fails → report to user, do not implement inline
```

Never fall back to implementing inline in the main session unless the change is
trivially small (< 5 lines, no logic). Implementing inline burns your Pro context.

---

## Routing Examples

| Task Description                                  | Score | Route                              |
|---------------------------------------------------|-------|------------------------------------|
| "Add a loading spinner to the Submit button"      | 5     | openrouter → qwen3-8b              |
| "Refactor all API calls to use a shared client"   | 9     | openrouter → qwen3-30b             |
| "Add JWT auth with refresh token rotation"        | 13    | codex (security override)          |
| "Fix off-by-one in pagination component"          | 6     | openrouter → qwen3-8b (bug fix override) |
| "Build a real-time presence system with WebSockets"| 14   | codex                              |
| "Rename all instances of `userId` to `accountId`" | 7     | openrouter → qwen3-30b (refactor override) |
