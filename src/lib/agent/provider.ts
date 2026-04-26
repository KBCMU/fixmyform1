/**
 * AgentProvider — the single interface every LLM backend must implement.
 *
 * The provider is responsible ONLY for making the chat completion call
 * and mapping the response. It does NOT handle the tool-call execution
 * loop — that belongs to the orchestrator (Phase 3).
 */

import type { AgentMessage, AgentResponse, AgentTool } from './types';

export interface AgentProvider {
  chat(
    messages: AgentMessage[],
    options?: {
      tools?: AgentTool[];
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AgentResponse>;
}
