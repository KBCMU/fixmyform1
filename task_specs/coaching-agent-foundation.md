# Task: Coaching Agent Foundation — Provider Abstraction & DB Tables

## Goal
Create the agent infrastructure layer: a clean LLM provider interface wrapping OpenRouter (with tool/function-calling support), shared agent types, and Supabase tables for coach profiles and conversation persistence.

## Context
- This is Phase 1 of the coaching agent feature. All subsequent phases depend on this.
- Existing OpenRouter usage pattern: `src/app/api/chat/route.ts` (raw fetch, no tool-use)
- Existing DB migration pattern: `supabase/migrations/004_user_programs.sql` (UUID PKs, RLS, auth.users FK)
- Existing Supabase types: `src/lib/supabase/database.types.ts`
- **No Anthropic SDK** — all LLM calls go through OpenRouter only.
- OpenRouter supports OpenAI-compatible function calling via `tools` parameter.

## Files to Create

### 1. `src/lib/agent/types.ts` — Shared agent types
```typescript
// Message roles
type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

// A single message in a conversation
interface AgentMessage {
  role: MessageRole;
  content: string | null;
  toolCalls?: ToolCall[];    // when role=assistant and agent wants to call tools
  toolCallId?: string;       // when role=tool (response to a tool call)
}

// Tool definition (OpenAI-compatible function calling format)
interface AgentTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema
  };
}

// A tool call from the LLM
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

// Provider response
interface AgentResponse {
  message: AgentMessage;
  usage?: { promptTokens: number; completionTokens: number };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

// Coach profile (matches DB schema)
interface CoachProfile {
  id: string;
  userId: string;
  trainingBackground: TrainingBackground;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrainingBackground {
  experienceYears: number;
  experienceLevel: 'never' | 'beginner' | 'intermediate' | 'advanced';
  primaryGoals: string[];       // e.g. ['hypertrophy', 'strength']
  trainingFrequency: number;    // days per week
  injuries: string[];           // free text descriptions
  preferredEquipment: string[]; // e.g. ['machines', 'cables', 'dumbbells']
  dietApproach: string;         // e.g. 'tracking macros', 'intuitive', 'not tracking'
  additionalNotes?: string;
}

// Conversation types (match DB schema)
interface CoachConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CoachMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string | null;
  toolData: Record<string, unknown> | null;
  createdAt: string;
}
```

Export all types.

### 2. `src/lib/agent/provider.ts` — Provider interface
```typescript
interface AgentProvider {
  chat(
    messages: AgentMessage[],
    options?: {
      tools?: AgentTool[];
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AgentResponse>;
}
```

Export the interface only.

### 3. `src/lib/agent/providers/openrouter.ts` — OpenRouter implementation
- Implements `AgentProvider`
- Uses `fetch` to call `https://openrouter.ai/api/v1/chat/completions`
- Model configurable via constructor (default: `process.env.OPENROUTER_COACH_MODEL || 'qwen/qwen3-8b'`)
- Passes `tools` array when provided (OpenAI-compatible function calling)
- Maps OpenRouter response to `AgentResponse`
- Sets headers: Authorization, HTTP-Referer, X-Title
- Handles errors gracefully (401, 402, 429)
- Reference existing pattern in `src/app/api/chat/route.ts` lines 75-89

### 4. `src/lib/agent/index.ts` — Barrel export
Re-export all types and the OpenRouter provider.

### 5. `supabase/migrations/005_coach_profiles.sql`
```sql
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  training_background JSONB NOT NULL DEFAULT '{}',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: users can CRUD their own profile
CREATE POLICY "Users can view their own coach profile"
  ON coach_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coach profile"
  ON coach_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own coach profile"
  ON coach_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
```

### 6. `supabase/migrations/006_coach_conversations.sql`
```sql
CREATE TABLE coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON coach_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations"
  ON coach_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations"
  ON coach_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations"
  ON coach_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_coach_conversations_user_id ON coach_conversations(user_id);

-- Messages table
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES coach_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT,
  tool_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS via conversation ownership
CREATE POLICY "Users can view messages in their conversations"
  ON coach_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coach_conversations
    WHERE coach_conversations.id = coach_messages.conversation_id
    AND coach_conversations.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert messages in their conversations"
  ON coach_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM coach_conversations
    WHERE coach_conversations.id = coach_messages.conversation_id
    AND coach_conversations.user_id = auth.uid()
  ));

CREATE INDEX idx_coach_messages_conversation_id ON coach_messages(conversation_id);
CREATE INDEX idx_coach_messages_created_at ON coach_messages(created_at);
```

### 7. Update `src/lib/supabase/database.types.ts`
Add types for `coach_profiles`, `coach_conversations`, `coach_messages` tables following the existing pattern.

## Acceptance Criteria
- [ ] `AgentProvider` interface defined with `chat()` method supporting tool-use
- [ ] `OpenRouterProvider` implements `AgentProvider`, uses fetch, handles function calling
- [ ] All agent types exported from `src/lib/agent/index.ts`
- [ ] Migration 005 creates `coach_profiles` with RLS
- [ ] Migration 006 creates `coach_conversations` + `coach_messages` with RLS
- [ ] `database.types.ts` updated with new table types
- [ ] No imports from `@anthropic-ai/sdk` in any new files
- [ ] `npm run check` passes (no type errors)

## Implementation Notes
- Follow the existing OpenRouter fetch pattern from `src/app/api/chat/route.ts`
- Follow the existing migration pattern from `supabase/migrations/004_user_programs.sql`
- The provider should NOT handle the agent loop (tool call → execute → respond) — that's Phase 3's orchestrator
- Keep it simple: no streaming yet, no retry logic beyond basic error handling
