/**
 * OpenRouter implementation of AgentProvider.
 *
 * Uses the OpenAI-compatible chat completions endpoint exposed by
 * OpenRouter, including function-calling via the `tools` parameter.
 */

import type { AgentProvider } from '../provider';
import type {
  AgentMessage,
  AgentResponse,
  AgentTool,
  ToolCall,
} from '../types';

// ── OpenRouter response shape (subset we care about) ───────────

interface OpenRouterChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
  };
  finish_reason: string;
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  error?: { message: string };
}

// ── Provider ───────────────────────────────────────────────────

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterProvider implements AgentProvider {
  private apiKey: string;
  private model: string;
  private referer: string;

  constructor(options?: { apiKey?: string; model?: string; referer?: string }) {
    this.apiKey = (options?.apiKey ?? process.env.OPENROUTER_API_KEY ?? '').trim();
    this.model =
      options?.model ??
      process.env.OPENROUTER_COACH_MODEL ??
      'qwen/qwen3-8b';
    this.referer =
      options?.referer ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000';
  }

  async chat(
    messages: AgentMessage[],
    options?: {
      tools?: AgentTool[];
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<AgentResponse> {
    if (!this.apiKey) {
      throw new Error(
        'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in your environment.',
      );
    }

    // Build the request body ------------------------------------------------
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map((m) => formatMessage(m)),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    };

    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools;
    }

    // Call OpenRouter -------------------------------------------------------
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.referer,
        'X-Title': 'FixMyForm',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as OpenRouterResponse;

    if (!data.choices?.[0]?.message) {
      throw new Error('Unexpected response format from OpenRouter API');
    }

    return mapResponse(data);
  }

  // ── Error handling ──────────────────────────────────────────

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorText = '';
    try {
      errorText = await response.text();
      const errorJson = JSON.parse(errorText) as { error?: { message?: string } };

      if (response.status === 401) {
        throw new Error(
          'Authentication failed. Please verify your OpenRouter API key is correct and active.',
        );
      }
      if (response.status === 402) {
        throw new Error(
          'OpenRouter requires credits. Please add credits at https://openrouter.ai/settings/credits',
        );
      }
      if (response.status === 429) {
        throw new Error(
          'Rate limit or quota exceeded. Please try again later or check your OpenRouter dashboard.',
        );
      }
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorJson.error?.message ?? errorText.substring(0, 200)}`,
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes('OpenRouter')) {
        throw err;
      }
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorText.substring(0, 200) || response.statusText}`,
      );
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────

/** Convert an AgentMessage to the wire format expected by OpenRouter. */
function formatMessage(
  msg: AgentMessage,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    role: msg.role,
    content: msg.content,
  };

  if (msg.toolCalls && msg.toolCalls.length > 0) {
    out.tool_calls = msg.toolCalls.map((tc) => ({
      id: tc.id,
      type: tc.type,
      function: tc.function,
    }));
  }

  if (msg.toolCallId) {
    out.tool_call_id = msg.toolCallId;
  }

  return out;
}

/** Map the raw OpenRouter response into our AgentResponse type. */
function mapResponse(data: OpenRouterResponse): AgentResponse {
  const choice = data.choices![0];
  const rawMsg = choice.message;

  const toolCalls: ToolCall[] | undefined = rawMsg.tool_calls?.map((tc) => ({
    id: tc.id,
    type: tc.type as 'function',
    function: {
      name: tc.function.name,
      arguments: tc.function.arguments,
    },
  }));

  const finishReason = normalizeFinishReason(choice.finish_reason);

  return {
    message: {
      role: 'assistant',
      content: rawMsg.content,
      toolCalls,
    },
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
        }
      : undefined,
    finishReason,
  };
}

function normalizeFinishReason(
  raw: string,
): AgentResponse['finishReason'] {
  switch (raw) {
    case 'stop':
      return 'stop';
    case 'tool_calls':
      return 'tool_calls';
    case 'length':
      return 'length';
    default:
      return 'error';
  }
}
