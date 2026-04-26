/**
 * Agent infrastructure — barrel export.
 *
 * Re-exports all shared types, the provider interface,
 * and the concrete OpenRouter implementation.
 */

// Types
export type {
  MessageRole,
  AgentMessage,
  AgentTool,
  ToolCall,
  AgentResponse,
  TrainingBackground,
  CoachProfile,
  CoachConversation,
  CoachMessage,
} from './types';

// Provider interface
export type { AgentProvider } from './provider';

// Concrete providers
export { OpenRouterProvider } from './providers/openrouter';
