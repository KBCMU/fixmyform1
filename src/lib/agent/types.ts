/**
 * Shared types for the coaching agent infrastructure.
 * These types define the message format, tool-calling protocol,
 * coach profiles, and conversation persistence structures.
 */

// ── Message types ──────────────────────────────────────────────

/** Roles that can appear in a conversation message. */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** A single message in an agent conversation. */
export interface AgentMessage {
  role: MessageRole;
  content: string | null;
  /** Present when role='assistant' and the model wants to invoke tools. */
  toolCalls?: ToolCall[];
  /** Present when role='tool' — the ID of the tool call this responds to. */
  toolCallId?: string;
}

// ── Tool-calling types (OpenAI-compatible) ─────────────────────

/** A tool definition passed to the provider. */
export interface AgentTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema object
  };
}

/** A tool invocation requested by the LLM. */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON-encoded string
  };
}

// ── Provider response ──────────────────────────────────────────

/** The structured response returned by an AgentProvider. */
export interface AgentResponse {
  message: AgentMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

// ── Coach profile (mirrors DB schema) ──────────────────────────

export interface TrainingBackground {
  experienceYears: number;
  experienceLevel: 'never' | 'beginner' | 'intermediate' | 'advanced';
  primaryGoals: string[];
  trainingFrequency: number;
  injuries: string[];
  preferredEquipment: string[];
  dietApproach: string;
  additionalNotes?: string;
}

export interface CoachProfile {
  id: string;
  userId: string;
  trainingBackground: TrainingBackground;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Conversation persistence (mirrors DB schema) ───────────────

export interface CoachConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string | null;
  toolData: Record<string, unknown> | null;
  createdAt: string;
}
