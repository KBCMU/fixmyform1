# /task — Plan, Delegate, and Review a Task

Start a full orchestration cycle for a new feature or fix.

## Usage
```
/task <brief description of what you want done>
```

## What This Does

1. **Plan** — Claude writes a spec to `task_specs/<slug>.md`
2. **Delegate** — Hands the spec to the right implementer subagent
3. **Review** — Runs the reviewer subagent on the output
4. **Log** — Updates `progress.md`

## Instructions for Claude

When this command is invoked:

1. Ask 2-3 clarifying questions if the task is ambiguous (keep it short)
2. Create `task_specs/` directory if it doesn't exist
3. Write the task spec to `task_specs/<kebab-slug>.md` using the standard template from CLAUDE.md
4. **Invoke `@agent-implementation-router`** — pass it the spec and let it score and decide the implementer. Do not skip this step or guess the route yourself.
5. Invoke the implementer subagent the router selected, with the spec path
6. After implementation, invoke the `reviewer` subagent
7. Present the review verdict to the user
8. Update `progress.md` with status

Keep your own token usage minimal — write detailed specs, then delegate.
