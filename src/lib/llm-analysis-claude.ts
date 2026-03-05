/**
 * LLM Analysis Service
 * Generates form feedback via the /api/analyze endpoint (OpenRouter)
 */

import type { PoseComparisonResult } from "./pose-comparison";
import type { Exercise } from "./supabase";

export interface FormFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  detailedTips: string[];
  progressionAdvice?: string;
  compensatoryPatterns?: string[];
  injuryRisks?: string[];
  movementMetrics?: {
    metric: string;
    value: string;
    normalRange?: string;
  }[];
}

/**
 * Generate feedback using the LLM analysis API
 */
export async function generateFeedbackWithClaude(
  exercise: Exercise,
  comparison: PoseComparisonResult,
  keyFrameImages?: string[]
): Promise<FormFeedback> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exercise,
        comparison,
        keyFrameImages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.feedback;
  } catch (error) {
    console.error("Error calling LLM analysis API:", error);

    // Fallback to structured feedback if API fails
    return generateFallbackFeedback(exercise, comparison);
  }
}

/**
 * Fallback feedback generation if API fails
 */
function generateFallbackFeedback(
  exercise: Exercise,
  evaluation: FormEvaluationResult | any
): FormFeedback {
  // Try to safely extract score and issues from either format
  const formScore = evaluation?.overallScore ?? evaluation?.formScore ?? 75;
  const issues = evaluation?.issues ?? evaluation?.criticalIssues ?? [];
  const positives = evaluation?.positives ?? [];
  const validReps = evaluation?.validReps ?? 0;
  const totalReps = evaluation?.totalReps ?? 0;

  let summary = "";
  if (formScore >= 90) {
    summary = `Excellent form! Your ${exercise.name} technique is outstanding with a score of ${Math.round(formScore)}/100. Keep up the great work!`;
  } else if (formScore >= 75) {
    summary = `Good form overall (${Math.round(formScore)}/100). You're doing the ${exercise.name} well, but there are a few areas for improvement to perfect your technique.`;
  } else if (formScore >= 60) {
    summary = `Moderate form (${Math.round(formScore)}/100). Your ${exercise.name} needs some adjustments to ensure safety and effectiveness.`;
  } else {
    summary = `Form needs attention (${Math.round(formScore)}/100). Your ${exercise.name} has several issues that should be addressed to prevent injury and improve results.`;
  }

  // Formatting strings
  const stringifyItem = (item: any) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      if (item.aspect && item.description) return `${item.aspect}: ${item.description}`;
      if (item.name) return item.name;
      if (item.description) return item.description;
    }
    return "Unknown item";
  };

  const strengths: string[] = positives.map(stringifyItem);

  if (strengths.length === 0 && formScore >= 60) {
    strengths.push("You're attempting the exercise with good effort");
  }

  const improvements: string[] = issues.map(stringifyItem);

  const detailedTips: string[] = [];
  (exercise.key_points || []).slice(0, 3).forEach((keyPoint) => {
    detailedTips.push(`Focus on: ${keyPoint}`);
  });

  (exercise.common_mistakes || []).slice(0, 3).forEach((mistake) => {
    detailedTips.push(`Avoid: ${mistake}`);
  });

  let progressionAdvice = "";
  if (formScore >= 85) {
    const level = exercise.experience_level?.toLowerCase() || "intermediate";
    progressionAdvice = `Your form is solid! Consider ${level === "beginner"
      ? "progressing to the intermediate variation or adding weight"
      : level === "intermediate"
        ? "attempting the advanced variation or increasing volume"
        : "maintaining perfect form while increasing intensity"
      }.`;
  } else if (formScore >= 70) {
    progressionAdvice = `Focus on perfecting your current form before increasing difficulty. Practice with lighter weight or bodyweight until these issues are resolved.`;
  } else {
    progressionAdvice = `Recommend working with lighter weight or regressing to an easier variation until form improves. Consider getting guidance from a coach.`;
  }

  return {
    summary,
    strengths: strengths.length > 0 ? strengths.slice(0, 5) : ["Keep practicing!"],
    improvements: improvements.length > 0 ? improvements.slice(0, 5) : ["Focus on the key movement patterns"],
    detailedTips: detailedTips.slice(0, 6),
    progressionAdvice,
    compensatoryPatterns: ["Unable to generate pattern analysis without AI"],
    injuryRisks: formScore < 70 ? ["Poor form may lead to joint stress"] : ["None detected automatically"],
    movementMetrics: []
  };
}

