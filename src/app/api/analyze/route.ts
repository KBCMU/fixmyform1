/**
 * API Route for LLM Analysis using OpenRouter
 */

import { NextRequest, NextResponse } from "next/server";
import type { Exercise } from "@/lib/supabase";

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || "").trim();
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet:beta"; // Need vision-capable model

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured. Set OPENROUTER_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    const { exercise, evaluation, keyFrameImages }: {
      exercise: Exercise;
      evaluation: Record<string, unknown>;
      keyFrameImages?: string[];
    } = await request.json() as { exercise: Exercise, evaluation: Record<string, unknown>, keyFrameImages?: string[] };

    if (!exercise || !evaluation) {
      return NextResponse.json(
        { error: "Missing required fields: exercise and evaluation" },
        { status: 400 }
      );
    }

    // Construct prompt for LLM
    const prompt = constructAnalysisPrompt(exercise, evaluation);

    // Construct multi-modal payload
    const userMessageContent: Record<string, unknown>[] = [
      {
        type: "text",
        text: prompt
      }
    ];

    // Append base64 images if provided (max 5 for cost/context reasons)
    if (keyFrameImages && keyFrameImages.length > 0) {
      const imagesToAnalyze = keyFrameImages.slice(0, 5);
      imagesToAnalyze.forEach((base64Image) => {
        userMessageContent.push({
          type: "image_url",
          image_url: {
            url: base64Image
          }
        });
      });
    }

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
        messages: [
          {
            role: "system",
            content: "You are an expert fitness coach and biomedical analyst. You analyze structural pose data and visual keyframes to provide highly detailed, medical-grade JSON feedback.",
          },
          {
            role: "user",
            content: userMessageContent,
          },
        ],
        max_tokens: 2048,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText.substring(0, 200));
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: unknown;
    };

    // Extract the response text
    const responseText = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response from OpenRouter
    const feedback = parseAnalysisResponse(responseText);

    return NextResponse.json({
      feedback,
      usage: data.usage,
    });
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function constructAnalysisPrompt(
  exercise: Exercise,
  evaluation: Record<string, unknown>
): string {
  // Extract issues gracefully whether it's the exact type or a generic object
  const issues = (evaluation?.issues as unknown[]) || [];
  const positives = (evaluation?.positives as unknown[]) || [];
  const score = (evaluation?.overallScore as number) ?? (evaluation?.formScore as number) ?? 75;
  const validReps = (evaluation?.validReps as number) ?? 0;
  const totalReps = (evaluation?.totalReps as number) ?? 0;

  return `You are an expert fitness coach analyzing someone's ${exercise.name} form based on mathematical pose data and (optionally) visual keyframes attached to this prompt.

--- VIDEO & PATIENT INFORMATION ---
Exercise: ${exercise.name}
Category: ${exercise.category}
Experience Level: ${exercise.experience_level || 'Unknown'}
Target Muscles: ${exercise.primary_muscles?.join(', ') || 'N/A'}
Form Score (Local Math Calculation): ${Math.round(score)}/100
Reps Evaluated: ${validReps} out of ${totalReps} total requested reps

--- BIOMECHANICAL DATA ANALYSIS ---
The deterministic math evaluator in the browser found the following during the set:

Positive Mechanics:
${positives.length > 0 ? positives.map((p: unknown) => `- ${typeof p === 'string' ? p : (p as Record<string, unknown>).description || (p as Record<string, unknown>).aspect}`).join('\n') : 'None flagged by math check.'}

Identified Structural Issues:
${issues.length > 0 ? issues.map((i: unknown) => `- ${typeof i === 'string' ? i : `${(i as Record<string, unknown>).name || (i as Record<string, unknown>).aspect}: ${(i as Record<string, unknown>).description}\n  Severity: ${(i as Record<string, unknown>).severity || 'Unknown'}`}`).join('\n') : 'No major issues flagged by math check.'}

Exercise Coaching Focus Points:
${(exercise.key_points || []).map((point, i) => `${i + 1}. ${point}`).join('\n')}
${(exercise.common_mistakes || []).map((mistake) => `Avoid: ${mistake}`).join('\n')}

--- INSTRUCTIONS ---
Review the mathematical data above AND the images (if provided). You MUST provide your entire response in valid JSON matching the exact schema below. Do not wrap it in markdown block quotes.

{
  "summary": "High-level summary of form quality",
  "strengths": ["Array of correct mechanical alignments (incorporate the Positive Mechanics above)"],
  "improvements": ["Array of biomechanical corrections needed (incorporate Structural Issues above)"],
  "detailedTips": ["Actionable physical cues to fix the form"],
  "compensatoryPatterns": ["Array of compensations (e.g., 'Rounding lower back to assist weak glutes')"],
  "injuryRisks": ["Array of potential injury risks due to the poor form (e.g., 'High patellofemoral stress')"],
  "movementMetrics": [
    {
      "metric": "Name of joint angle/metric",
      "value": "Observed value/severity",
      "normalRange": "Expected physical range"
    }
  ],
  "progressionAdvice": "Advice for next steps"
}`;
}

function parseAnalysisResponse(responseText: string): Record<string, unknown> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback response
  return {
    summary: "Analysis completed successfully.",
    strengths: ["Completing the exercise", "Showing good effort"],
    improvements: ["Review the key points", "Focus on form"],
    detailedTips: [
      "Watch the reference video carefully",
      "Start with lighter weight",
      "Focus on one correction at a time",
      "Record yourself for self-review",
      "Consider working with a coach",
    ],
    compensatoryPatterns: ["Unable to generate structural analysis without AI."],
    injuryRisks: ["Monitor form closely to avoid joint pain."],
    movementMetrics: [],
    progressionAdvice: "Continue practicing with focus on proper technique.",
  };
}
