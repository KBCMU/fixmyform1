/**
 * Agent Tool Registry
 *
 * Exports tool definitions (sent to the LLM) and an executor function
 * that dispatches tool calls to the correct implementation.
 */

import type { AgentTool } from '../types';
import { getUserProgram } from './getUserProgram';
import { getFormHistory } from './getFormHistory';
import { getExerciseInfo } from './getExerciseInfo';
import { getTrainingAdvice } from './getTrainingAdvice';

// ── Tool definitions (sent to the LLM) ───────────────────────────

export const AGENT_TOOLS: AgentTool[] = [
  {
    type: 'function',
    function: {
      name: 'getUserProgram',
      description:
        "Fetch the user's current training program including split type, workout days, exercises, sets, and rep ranges.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getFormHistory',
      description:
        "Fetch the user's recent form analysis history including exercises analyzed, scores, and issues detected.",
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent analyses to return (default 5)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getExerciseInfo',
      description:
        'Look up detailed information about a specific exercise including muscles targeted, movement pattern, equipment needed, and technique cues.',
      parameters: {
        type: 'object',
        properties: {
          exerciseName: {
            type: 'string',
            description: 'Name or partial name of the exercise to look up',
          },
        },
        required: ['exerciseName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTrainingAdvice',
      description:
        'Retrieve evidence-based training guidelines on a specific topic like volume, frequency, rep ranges, progressive overload, exercise selection, or deloading.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Training topic to get advice on',
          },
        },
        required: ['topic'],
      },
    },
  },
];

// ── Executor map ──────────────────────────────────────────────────

type ToolExecutor = (args: Record<string, unknown>, userId: string) => Promise<string>;

const TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  getUserProgram: (args, userId) =>
    getUserProgram(args as Record<string, never>, userId),
  getFormHistory: (args, userId) =>
    getFormHistory(args as { limit?: number }, userId),
  getExerciseInfo: (args) =>
    getExerciseInfo(args as { exerciseName: string }),
  getTrainingAdvice: (args) =>
    getTrainingAdvice(args as { topic: string }),
};

/**
 * Execute a tool by name with JSON-encoded arguments.
 * Returns the tool's text output, or an error message.
 */
export async function executeTool(
  name: string,
  argsJson: string,
  userId: string,
): Promise<string> {
  const executor = TOOL_EXECUTORS[name];

  if (!executor) {
    return `Unknown tool: "${name}". Available tools: ${Object.keys(TOOL_EXECUTORS).join(', ')}`;
  }

  try {
    const args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
    return await executor(args, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Tool "${name}" failed:`, message);
    return `Tool "${name}" encountered an error: ${message}`;
  }
}
