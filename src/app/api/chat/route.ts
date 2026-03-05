/**
 * API Route for Chat with OpenRouter AI
 * Handles follow-up questions after form analysis
 */

import { NextRequest, NextResponse } from "next/server";
import type { Exercise } from "@/lib/supabase";
import type { FormFeedback } from "@/lib/llm-analysis-claude";
import type { FormEvaluationResult } from "@/lib/formEvaluation/types";

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || "").trim();
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "allenai/molmo-2-8b:free";

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured. Set OPENROUTER_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    interface ChatRequestBody {
      exercise: Exercise;
      feedback: FormFeedback;
      evaluation: FormEvaluationResult;
      conversationHistory: Array<{ role: string; content: string }>;
      userMessage: string;
    }

    const body = await request.json() as ChatRequestBody;
    const {
      exercise,
      feedback,
      evaluation,
      conversationHistory,
      userMessage,
    } = body;

    if (!exercise || !feedback || !evaluation || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Construct system message with context
    const systemMessage = constructSystemMessage(exercise, feedback, evaluation);

    // Build conversation messages
    // Filter and validate conversation history (exclude system messages and empty messages)
    const validHistory = (conversationHistory || [])
      .filter((msg: { role?: string; content?: string }) => msg && msg.role && msg.content && msg.role !== "system")
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: String(msg.content).trim(),
      }))
      .filter((msg: { content: string }) => msg.content.length > 0);

    const messages = [
      {
        role: "system",
        content: systemMessage,
      },
      ...validHistory,
      {
        role: "user",
        content: userMessage.trim(),
      },
    ];

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "FixMyForm",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
        const errorJson = JSON.parse(errorText);

        // Handle authentication errors (401)
        if (response.status === 401) {
          throw new Error(`Authentication failed. Please verify your OpenRouter API key is correct and active.`);
        }

        // Handle payment/credits errors (402)
        if (response.status === 402 || errorJson.error?.message?.includes("Insufficient credits")) {
          throw new Error(`OpenRouter requires credits. Please add credits at https://openrouter.ai/settings/credits`);
        }

        // Handle quota errors (429)
        if (response.status === 429) {
          throw new Error(`Rate limit or quota exceeded. Please try again later or check your OpenRouter dashboard.`);
        }

        throw new Error(`OpenRouter API error (${response.status}): ${errorJson.error?.message || errorText.substring(0, 200)}`);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes("OpenRouter")) {
          throw parseError;
        }
        throw new Error(`OpenRouter API error (${response.status}): ${errorText.substring(0, 200) || response.statusText}`);
      }
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Unexpected response format from OpenRouter API");
    }

    const responseText = data.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";

    return NextResponse.json({
      response: responseText,
      usage: data.usage,
    });
  } catch (error) {
    console.error("Error in chat API route:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Failed to get chat response",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

function constructSystemMessage(
  exercise: Exercise,
  feedback: FormFeedback,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluation: FormEvaluationResult | any
): string {
  // Safely handle potentially undefined arrays
  const strengths = feedback.strengths || [];
  const improvements = feedback.improvements || [];
  const detailedTips = feedback.detailedTips || [];
  const keyPoints = exercise.key_points || [];
  const commonMistakes = exercise.common_mistakes || [];

  const score = evaluation?.overallScore ?? evaluation?.formScore ?? 75;
  const issues = evaluation?.issues || [];
  const positives = evaluation?.positives || [];
  const validReps = evaluation?.validReps ?? 0;
  const totalReps = evaluation?.totalReps ?? 0;

  return `You are an expert fitness coach helping a user improve their ${exercise.name} form. You've already analyzed their video and provided initial feedback.

**Exercise:** ${exercise.name}
**Category:** ${exercise.category}
${exercise.experience_level ? `**Experience Level:** ${exercise.experience_level}` : ''}

**User's Form Analysis:**
- Form Score: ${Math.round(score)}/100
- Reps Completed: ${validReps} out of ${totalReps}

**Initial Feedback Summary:**
${feedback.summary || 'No summary available'}

**Strengths:**
${strengths.length > 0 ? strengths.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'None identified'}

**Areas for Improvement:**
${improvements.length > 0 ? improvements.map((imp, idx) => `${idx + 1}. ${imp}`).join('\n') : 'None identified'}

**Detailed Tips:**
${detailedTips.length > 0 ? detailedTips.map((t, i) => `${i + 1}. ${t}`).join('\n') : 'No specific tips available'}

${feedback.progressionAdvice ? `**Progression Advice:** ${feedback.progressionAdvice}` : ''}

**Exercise Key Points:**
${keyPoints.length > 0 ? keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n') : 'No key points available'}

**Common Mistakes:**
${commonMistakes.length > 0 ? commonMistakes.map((mistake, i) => `${i + 1}. ${mistake}`).join('\n') : 'No common mistakes listed'}

**Target Muscles:** ${exercise.primary_muscles?.join(', ') || exercise.muscle_groups?.join(', ') || 'N/A'}
**Secondary Muscles:** ${exercise.secondary_muscles?.join(', ') || 'None'}

**Identified Issues (Deterministic checks):**
${issues.length > 0 ? issues.map((i: any) => `- ${typeof i === 'string' ? i : `${i.name || i.aspect}: ${i.description} (${i.severity})`}`).join('\n') : 'None flagged manually'}

**Positive Mechanics:**
${positives.length > 0 ? positives.slice(0, 5).map((p: any) => `- ${typeof p === 'string' ? p : p.description || p.aspect}`).join('\n') : 'None recorded'}

Answer the user's questions in a helpful, encouraging, and specific way. Reference the analysis data when relevant. Be concise but thorough. Focus on actionable advice.`;
}
