# Task: Coaching Agent Core — Orchestrator, Tools, Chat UI

## Goal
Build the core coaching agent: a tool-use orchestrator that manages conversations, a set of agent tools for fetching user data, a science-based system prompt, and a chat UI that replaces the placeholder on `/coach`.

## Context
- **Phase 1 complete:** Provider abstraction at `src/lib/agent/` — `AgentProvider` interface, `OpenRouterProvider`, types for messages/tools/profiles/conversations.
- **Phase 2 complete:** Onboarding wizard at `src/components/coach/`, API at `/api/coach/onboarding`, coach page at `src/app/coach/page.tsx` with placeholder.
- **DB tables exist:** `coach_profiles`, `coach_conversations`, `coach_messages` (migrations 005, 006).
- **Existing chat reference:** `src/app/api/chat/route.ts` — OpenRouter chat for form analysis follow-ups.
- **Program builder types:** `src/lib/programBuilder/types.ts` — `GeneratedProgram`, `WorkoutDay`, `ExerciseSlot`, etc.
- **This is the most complex phase.** It implements the agentic loop: LLM → tool_calls → execute tools → feed results back → LLM responds.

## Architecture

```
User message
    ↓
POST /api/coach/chat
    ↓
Load: user profile, conversation history from DB
    ↓
Build system prompt (science-based coach + user background)
    ↓
┌─→ Send messages to OpenRouterProvider.chat(messages, tools)
│       ↓
│   If finishReason === 'tool_calls':
│       Execute each tool call → collect results
│       Append tool call + results to messages
│       └─→ Loop back ↑
│   If finishReason === 'stop':
│       Save assistant message to DB
│       Return response to client
└─────────────────────────────────────────
```

## Files to Create

### 1. `src/lib/agent/orchestrator.ts` — Agent loop
The core agentic loop. Exported function:

```typescript
async function runAgentTurn(params: {
  conversationId: string;
  userId: string;
  userMessage: string;
  provider: AgentProvider;
}): Promise<{ response: string; toolsUsed: string[] }>
```

Logic:
1. Fetch coach profile from DB
2. Fetch conversation history from `coach_messages` (last 20 messages for context window)
3. Build system prompt via `buildSystemPrompt(profile)`
4. Construct messages array: [system, ...history, user message]
5. Save user message to DB
6. Call `provider.chat(messages, AGENT_TOOLS)` 
7. If `finishReason === 'tool_calls'`: execute each tool, append results, loop (max 3 iterations to prevent runaway)
8. Save assistant response to DB
9. Return the text response

### 2. `src/lib/agent/systemPrompt.ts` — System prompt builder
Builds the system prompt with user context injected:

```
You are an evidence-based hypertrophy coach. You follow science-based training 
principles aligned with researchers and educators like Chris Beardsley, TNF, 
Elijah Mundy, Keegan Mallory, and King Deltoids.

## Core Principles
- Volume landmarks matter: track sets per muscle per week
- Length-tension relationship guides exercise selection  
- Progressive overload is the primary driver of hypertrophy
- Technique quality enables safe progressive overload
- Individual variation matters — no one-size-fits-all

## User Background
Experience: {level} ({years} years)
Goals: {goals}
Training frequency: {frequency}x/week
Injuries/limitations: {injuries}
Equipment preferences: {equipment}
Diet approach: {diet}
{additionalNotes}

## Guidelines
- Reference the user's actual program and form data when relevant (use tools to fetch)
- Give specific, evidence-based advice — cite principles, not bro-science
- Be encouraging but honest about form issues
- If asked about injuries or medical concerns, recommend consulting a professional
- Keep responses concise unless the user asks for detail
- When the user asks about their program, use the getUserProgram tool
- When the user asks about their form history, use the getFormHistory tool
```

### 3. `src/lib/agent/tools/index.ts` — Tool registry
Exports the tool definitions array and the executor map:

```typescript
const AGENT_TOOLS: AgentTool[] = [...]
const TOOL_EXECUTORS: Record<string, (args: any, userId: string) => Promise<string>> = {...}

async function executeTool(name: string, args: string, userId: string): Promise<string>
```

### 4. `src/lib/agent/tools/getUserProgram.ts`
- Fetches from `user_programs` table for the user
- Returns latest program: split type, workout days with exercises, sets, rep ranges
- Formats as readable text for the LLM

Tool definition:
```json
{
  "name": "getUserProgram",
  "description": "Fetch the user's current training program including split type, workout days, exercises, sets, and rep ranges.",
  "parameters": { "type": "object", "properties": {}, "required": [] }
}
```

### 5. `src/lib/agent/tools/getFormHistory.ts`
- Fetches from `analysis_history` table for the user
- Returns last 5 form analyses: exercise, score, issues, date
- Formats as readable text

Tool definition:
```json
{
  "name": "getFormHistory",
  "description": "Fetch the user's recent form analysis history including exercises analyzed, scores, and issues detected.",
  "parameters": {
    "type": "object",
    "properties": {
      "limit": { "type": "number", "description": "Number of recent analyses to return (default 5)" }
    },
    "required": []
  }
}
```

### 6. `src/lib/agent/tools/getExerciseInfo.ts`
- Looks up exercise from the catalog (`src/lib/programBuilder/exerciseCatalog.ts`)
- Returns: name, movement pattern, primary/secondary muscles, muscle bias, length-tension, equipment, technique cues

Tool definition:
```json
{
  "name": "getExerciseInfo",
  "description": "Look up detailed information about a specific exercise including muscles targeted, movement pattern, equipment needed, and technique cues.",
  "parameters": {
    "type": "object",
    "properties": {
      "exerciseName": { "type": "string", "description": "Name or partial name of the exercise to look up" }
    },
    "required": ["exerciseName"]
  }
}
```

### 7. `src/lib/agent/tools/getTrainingAdvice.ts`
- Returns evidence-based guidelines for a given topic
- Topics: volume, frequency, rep ranges, progressive overload, exercise selection, deload
- Hardcoded knowledge base (not a DB call) — curated from evidence-based sources

Tool definition:
```json
{
  "name": "getTrainingAdvice",
  "description": "Retrieve evidence-based training guidelines on a specific topic like volume, frequency, rep ranges, progressive overload, exercise selection, or deloading.",
  "parameters": {
    "type": "object",
    "properties": {
      "topic": { "type": "string", "description": "Training topic to get advice on" }
    },
    "required": ["topic"]
  }
}
```

### 8. `src/app/api/coach/chat/route.ts` — API endpoint
POST endpoint:
- Authenticate user via Supabase
- Accept `{ conversationId?: string, message: string }`
- If no conversationId: create new conversation in `coach_conversations`
- Call `runAgentTurn()` with the OpenRouterProvider
- Return `{ conversationId, response, toolsUsed }`
- Streaming is a nice-to-have but NOT required for v1 — standard JSON response is fine

### 9. `src/components/coach/ChatInterface.tsx` (client component)
Chat UI that replaces the placeholder. Features:
- Message list with user/assistant bubbles
- Text input with send button
- Loading indicator while agent responds
- Conversation persistence: loads history on mount from `/api/coach/conversations`
- New conversation button
- **Style:** Match DESIGN.md. Dark cards (#0A0A0A), orange accent for user messages, white text.

### 10. `src/app/api/coach/conversations/route.ts`
GET endpoint:
- Returns list of user's conversations (id, title, created_at)
- Used by ChatInterface to populate sidebar/selector

GET with `?id=<conversationId>`:
- Returns conversation messages for a specific conversation

### 11. Modify `src/app/coach/page.tsx`
Replace the "Coach Chat Coming Soon" placeholder div with `<ChatInterface />` component when `onboarding_complete === true`.

## Acceptance Criteria
- [ ] Agent orchestrator implements the tool-call loop (max 3 iterations)
- [ ] System prompt includes science-based principles and user background
- [ ] All 4 tools work: getUserProgram, getFormHistory, getExerciseInfo, getTrainingAdvice
- [ ] Agent correctly decides when to call tools vs respond directly
- [ ] Messages persisted in `coach_messages` table
- [ ] Chat UI displays conversation history
- [ ] Conversations survive page refresh (reload fetches from DB)
- [ ] New conversations can be started
- [ ] Auth required on all endpoints
- [ ] `npm run check` passes

## Implementation Notes
- The orchestrator is the core complexity — get the tool-call loop right
- Use `createClient` from `src/lib/supabase/server.ts` in API routes
- Use `src/lib/supabase/client.ts` in client components
- Import exercise catalog from `src/lib/programBuilder/exerciseCatalog.ts` (use `getExercisesByPattern` or `getExerciseById`)
- The `getTrainingAdvice` tool should have a hardcoded knowledge base of ~6-8 topics, not an LLM call
- For conversation titles: auto-generate from first user message (first 50 chars) — don't use an LLM call for this
- Max tool loop iterations = 3 prevents infinite loops if LLM keeps requesting tools
- This has backend complexity (orchestrator) AND UI work — may need to split delegation
