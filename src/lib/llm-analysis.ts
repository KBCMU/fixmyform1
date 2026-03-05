/**
 * LLM Analysis Service
 * Uses Cloudflare Workers AI (Llama 3.3) to generate feedback
 */

import type { PoseComparisonResult } from "./pose-comparison";
import type { Exercise } from "./exercises";

export interface FormFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  detailedTips: string[];
  progressionAdvice?: string;
}

/**
 * Generate feedback using LLM based on pose comparison
 * This would connect to Cloudflare Workers AI in production
 */
export async function generateFeedback(
  exercise: Exercise,
  comparison: PoseComparisonResult
): Promise<FormFeedback> {
  // For now, generate structured feedback based on the comparison
  // In production, this would call Workers AI with Llama 3.3

  const formScore = comparison.formScore;

  // Generate summary
  let summary = "";
  if (formScore >= 90) {
    summary = `Excellent form! Your ${exercise.name} technique is outstanding with a score of ${formScore}/100. Keep up the great work!`;
  } else if (formScore >= 75) {
    summary = `Good form overall (${formScore}/100). You're doing the ${exercise.name} well, but there are a few areas for improvement to perfect your technique.`;
  } else if (formScore >= 60) {
    summary = `Moderate form (${formScore}/100). Your ${exercise.name} needs some adjustments to ensure safety and effectiveness.`;
  } else {
    summary = `Form needs attention (${formScore}/100). Your ${exercise.name} has several issues that should be addressed to prevent injury and improve results.`;
  }

  // Identify strengths
  const strengths: string[] = [];
  comparison.jointDifferences
    .filter((diff) => diff.severity === "good")
    .forEach((diff) => {
      strengths.push(`${diff.joint} position is correct`);
    });

  if (strengths.length === 0 && formScore >= 60) {
    strengths.push("You're attempting the exercise with good effort");
  }

  // Generate improvement suggestions
  const improvements: string[] = [];

  // Add critical issues first
  comparison.criticalIssues.forEach((issue) => {
    improvements.push(issue);
  });

  // Add exercise-specific common mistakes that apply
  comparison.jointDifferences
    .filter((diff) => diff.severity === "critical" || diff.severity === "moderate")
    .forEach((diff) => {
      improvements.push(diff.description);
    });

  // Generate detailed tips
  const detailedTips: string[] = [];

  // Map joint issues to exercise key points
  exercise.keyPoints.forEach((keyPoint) => {
    const relevantIssues = comparison.jointDifferences.filter(
      (diff) => diff.severity !== "good" &&
        keyPoint.toLowerCase().includes(diff.joint.toLowerCase().split(" ")[1] || "")
    );

    if (relevantIssues.length > 0) {
      detailedTips.push(`Focus on: ${keyPoint}`);
    }
  });

  // Add exercise-specific tips based on common mistakes
  exercise.commonMistakes.slice(0, 3).forEach((mistake) => {
    detailedTips.push(`Avoid: ${mistake}`);
  });

  // Generate progression advice
  let progressionAdvice = "";
  if (formScore >= 85) {
    progressionAdvice = `Your form is solid! Consider ${exercise.difficulty === "beginner"
        ? "progressing to the intermediate variation or adding weight"
        : exercise.difficulty === "intermediate"
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
  };
}

/**
 * In production, this would call Cloudflare Workers AI
 */
export async function generateFeedbackWithLLM(
  exercise: Exercise,
  comparison: PoseComparisonResult
): Promise<FormFeedback> {
  // This is a placeholder for the actual LLM call
  // In production, you would:
  // 1. Format the comparison data for the LLM
  // 2. Call Workers AI API with Llama 3.3
  // 3. Parse the LLM response

  // const response = await fetch('/api/ai/analyze', {
  //   method: 'POST',
  //   body: JSON.stringify({ prompt: "..." }),
  // });

  return generateFeedback(exercise, comparison);
}

