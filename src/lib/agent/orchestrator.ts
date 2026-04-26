/**
 * Agent Orchestrator
 *
 * Implements the agentic tool-call loop:
 *   LLM -> tool_calls -> execute -> feed results back -> LLM responds
 *
 * Max 3 tool-call iterations to prevent runaway loops.
 */

import type { AgentProvider } from './provider';
import type { AgentMessage, TrainingBackground } from './types';
import { buildSystemPrompt } from './systemPrompt';
import { AGENT_TOOLS, executeTool } from './tools';
import { createClient } from '@/lib/supabase/server';

const MAX_TOOL_ITERATIONS = 3;
const MAX_HISTORY_MESSAGES = 20;

interface AgentTurnParams {
  conversationId: string;
  userId: string;
  userMessage: string;
  provider: AgentProvider;
}

interface AgentTurnResult {
  response: string;
  toolsUsed: string[];
}

/**
 * Run a single agent turn: process the user message, potentially
 * call tools in a loop, and return the final text response.
 */
export async function runAgentTurn(
  params: AgentTurnParams,
): Promise<AgentTurnResult> {
  const { conversationId, userId, userMessage, provider } = params;
  const supabase = await createClient();

  // 1. Fetch coach profile for system prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow } = await (supabase as any)
    .from('coach_profiles')
    .select('training_background')
    .eq('user_id', userId)
    .single();

  const trainingBackground: TrainingBackground = profileRow?.training_background ?? {
    experienceYears: 0,
    experienceLevel: 'beginner',
    primaryGoals: ['general fitness'],
    trainingFrequency: 3,
    injuries: [],
    preferredEquipment: ['machines'],
    dietApproach: 'not specified',
  };

  // 2. Fetch conversation history (last N messages)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: historyRows } = await (supabase as any)
    .from('coach_messages')
    .select('role, content, tool_data, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  const history: AgentMessage[] = ((historyRows ?? []) as Array<{
    role: string;
    content: string | null;
    tool_data: Record<string, unknown> | null;
  }>)
    .filter((row) => row.role === 'user' || row.role === 'assistant')
    .map((row) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
    }));

  // 3. Build system prompt
  const systemPrompt = buildSystemPrompt(trainingBackground);

  // 4. Construct messages array
  const messages: AgentMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  // 5. Save user message to DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('coach_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userMessage,
  });

  // 6. Agentic tool-call loop
  const toolsUsed: string[] = [];
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    const agentResponse = await provider.chat(messages, {
      tools: AGENT_TOOLS,
      temperature: 0.7,
      maxTokens: 1024,
    });

    if (agentResponse.finishReason === 'tool_calls' && agentResponse.message.toolCalls?.length) {
      // Append the assistant message with tool calls to the conversation
      messages.push(agentResponse.message);

      // Execute each tool call
      for (const toolCall of agentResponse.message.toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = toolCall.function.arguments;

        toolsUsed.push(toolName);

        const result = await executeTool(toolName, toolArgs, userId);

        // Append the tool result as a tool message
        messages.push({
          role: 'tool',
          content: result,
          toolCallId: toolCall.id,
        });
      }

      iterations++;
      continue;
    }

    // finishReason is 'stop' (or 'length'/'error') — we have the final response
    const responseText =
      agentResponse.message.content ??
      'I apologize, but I was unable to generate a response. Please try again.';

    // 7. Save assistant response to DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('coach_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: responseText,
      tool_data: toolsUsed.length > 0 ? { toolsUsed } : null,
    });

    return {
      response: responseText,
      toolsUsed,
    };
  }

  // Max iterations reached — force a final response without tools
  const fallbackResponse = await provider.chat(messages, {
    temperature: 0.7,
    maxTokens: 1024,
    // No tools — force a text response
  });

  const fallbackText =
    fallbackResponse.message.content ??
    'I gathered some information but had trouble composing a full response. Please try rephrasing your question.';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('coach_messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: fallbackText,
    tool_data: toolsUsed.length > 0 ? { toolsUsed } : null,
  });

  return {
    response: fallbackText,
    toolsUsed,
  };
}
