/**
 * Form Analysis Tool
 * Formats FormEvaluationResult into readable text for LLM consumption
 */

import type { FormEvaluationResult } from "@/lib/formEvaluation/types";

/**
 * Format a form evaluation result into readable text suitable for LLM consumption
 * Uses the same pattern as buildEvaluationMessage in llm-coaching.ts
 */
export function formatEvaluationForAgent(result: FormEvaluationResult): string {
  if (result.cameraSetupIssue) {
    return `Form Analysis: Camera setup issue detected.\n${result.cameraSetupIssue}\nPlease adjust camera setup and try again.`;
  }

  let message = `Form Analysis for ${result.exercise}:\n\n`;

  message += `Performance Summary:\n`;
  message += `- Completed ${result.validReps} valid reps out of ${result.totalReps} total\n`;
  message += `- Overall Form Score: ${result.overallScore}/100\n\n`;

  if (result.issues.length > 0) {
    message += `Form Issues Detected:\n`;
    for (const issue of result.issues) {
      const emoji = getSeverityEmoji(issue.severity);
      message += `\n${emoji} ${issue.name} (${issue.severity})\n`;
      message += `   ${issue.description}\n`;
      message += `   Confidence: ${Math.round(issue.confidence * 100)}%\n`;
    }
    message += `\n`;
  }

  if (result.positives.length > 0) {
    message += `What You're Doing Well:\n`;
    for (const positive of result.positives) {
      message += `✅ ${positive}\n`;
    }
    message += `\n`;
  }

  return message;
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: "minor" | "moderate" | "severe"): string {
  const emojis = {
    minor: "⚠️",
    moderate: "⚠️",
    severe: "❌",
  };
  return emojis[severity];
}
