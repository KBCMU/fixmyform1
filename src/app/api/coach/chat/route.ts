/**
 * POST /api/coach/chat
 *
 * Orchestrates a single agent turn: accepts a user message,
 * runs the agentic loop (LLM + tools), and returns the response.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenRouterProvider } from '@/lib/agent/providers/openrouter';
import { runAgentTurn } from '@/lib/agent/orchestrator';
import type { FormEvaluationResult } from '@/lib/formEvaluation/types';

interface ChatRequestBody {
  conversationId?: string;
  message: string;
  evaluation?: FormEvaluationResult;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const body = (await request.json()) as ChatRequestBody;

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    let message = body.message.trim();

    // Prepend evaluation data to message if provided
    if (body.evaluation) {
      const evalResult = body.evaluation;
      const issuesText = evalResult.issues.length > 0
        ? evalResult.issues.map((i) => `${i.name} (${i.severity})`).join(", ")
        : "None detected";
      const positivesText = evalResult.positives.length > 0
        ? evalResult.positives.join(", ")
        : "None noted";

      const evaluationSummary = `I'm sharing a video of my ${evalResult.exercise}. Here are the evaluation results:\n` +
        `- Score: ${evalResult.overallScore}/100\n` +
        `- Valid Reps: ${evalResult.validReps}/${evalResult.totalReps}\n` +
        `- Issues: ${issuesText}\n` +
        `- Strengths: ${positivesText}\n\n` +
        `User's actual question: ${message}`;

      message = evaluationSummary;
    }
    let conversationId = body.conversationId;

    // If no conversationId, create a new conversation
    if (!conversationId) {
      const title = message.length > 50 ? message.substring(0, 47) + '...' : message;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: conversation, error: convError } = await (supabase as any)
        .from('coach_conversations')
        .insert({
          user_id: userId,
          title,
        })
        .select('id')
        .single();

      if (convError || !conversation) {
        console.error('Failed to create conversation:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 },
        );
      }

      conversationId = (conversation as { id: string }).id;
    } else {
      // Verify the conversation belongs to this user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('coach_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!existing) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 },
        );
      }

      // Update the conversation's updated_at timestamp
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('coach_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    // Run the agent turn
    const provider = new OpenRouterProvider();
    const result = await runAgentTurn({
      conversationId: conversationId!,
      userId,
      userMessage: message,
      provider,
    });

    return NextResponse.json({
      conversationId,
      response: result.response,
      toolsUsed: result.toolsUsed,
    });
  } catch (err) {
    console.error('Coach chat error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      { error: 'Failed to process message', details: errorMessage },
      { status: 500 },
    );
  }
}
