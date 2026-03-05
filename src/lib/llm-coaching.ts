/**
 * LLM Coaching Layer
 * Updated to use FormEvaluationResult instead of raw pose data
 */

import Anthropic from "@anthropic-ai/sdk";
import type { FormEvaluationResult } from "./formEvaluation/types";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface CoachingContext {
    evaluationResult: FormEvaluationResult;
    userExperienceLevel?: "beginner" | "intermediate" | "advanced";
    userName?: string;
}

export interface CoachingResponse {
    message: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}

/**
 * Generate coaching feedback from form evaluation
 * LLM is used ONLY for explanation and coaching, NOT for form detection
 */
export async function generateCoachingFeedback(
    context: CoachingContext
): Promise<CoachingResponse> {
    const { evaluationResult, userExperienceLevel = "intermediate", userName } = context;

    // Build system prompt
    const systemPrompt = `You are an expert fitness coach providing personalized feedback on exercise form.

CRITICAL: You are receiving DETERMINISTIC form evaluation results. Your role is to:
1. Explain the detected issues in clear, actionable language
2. Provide coaching tips and cues
3. Motivate and encourage the user
4. Answer follow-up questions about form improvement

You must NOT:
- Re-analyze or second-guess the form evaluation
- Make new form judgments
- Request raw pose data or angles

User experience level: ${userExperienceLevel}`;

    // Build user message with evaluation results
    const userMessage = buildEvaluationMessage(evaluationResult, userName);

    try {
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: userMessage,
                },
            ],
        });

        const message = response.content[0].type === "text" ? response.content[0].text : "";

        return {
            message,
            usage: {
                input_tokens: response.usage.input_tokens,
                output_tokens: response.usage.output_tokens,
            },
        };
    } catch (error) {
        console.error("Error generating coaching feedback:", error);
        throw new Error("Failed to generate coaching feedback");
    }
}

/**
 * Handle follow-up coaching questions
 */
export async function handleCoachingQuestion(
    question: string,
    context: CoachingContext,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<CoachingResponse> {
    const { evaluationResult, userExperienceLevel = "intermediate" } = context;

    const systemPrompt = `You are an expert fitness coach. You previously provided feedback on a ${evaluationResult.exercise} form evaluation.

Form Evaluation Summary:
- Exercise: ${evaluationResult.exercise}
- Valid Reps: ${evaluationResult.validReps}/${evaluationResult.totalReps}
- Overall Score: ${evaluationResult.overallScore}/100
- Issues Detected: ${evaluationResult.issues.map((i) => i.name).join(", ") || "None"}
- Positives: ${evaluationResult.positives.join(", ") || "None"}

Answer the user's follow-up question based on this evaluation. Provide specific, actionable advice.

User experience level: ${userExperienceLevel}`;

    try {
        const messages = [
            ...conversationHistory.map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })),
            {
                role: "user" as const,
                content: question,
            },
        ];

        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            system: systemPrompt,
            messages,
        });

        const message = response.content[0].type === "text" ? response.content[0].text : "";

        return {
            message,
            usage: {
                input_tokens: response.usage.input_tokens,
                output_tokens: response.usage.output_tokens,
            },
        };
    } catch (error) {
        console.error("Error handling coaching question:", error);
        throw new Error("Failed to handle coaching question");
    }
}

/**
 * Build evaluation message for LLM
 */
function buildEvaluationMessage(
    result: FormEvaluationResult,
    userName?: string
): string {
    const greeting = userName ? `Hi ${userName}! ` : "Hi! ";

    if (result.cameraSetupIssue) {
        return `${greeting}I analyzed your ${result.exercise} video, but encountered a setup issue:\n\n${result.cameraSetupIssue}\n\nPlease adjust your camera setup and try again.`;
    }

    let message = `${greeting}I analyzed your ${result.exercise} form. Here's what I found:\n\n`;

    message += `**Performance Summary:**\n`;
    message += `- Completed ${result.validReps} valid reps out of ${result.totalReps} total\n`;
    message += `- Overall Form Score: ${result.overallScore}/100\n\n`;

    if (result.issues.length > 0) {
        message += `**Form Issues Detected:**\n`;
        for (const issue of result.issues) {
            message += `\n${getSeverityEmoji(issue.severity)} **${issue.name}** (${issue.severity})\n`;
            message += `   ${issue.description}\n`;
            message += `   Confidence: ${Math.round(issue.confidence * 100)}%\n`;
        }
        message += `\n`;
    }

    if (result.positives.length > 0) {
        message += `**What You're Doing Well:**\n`;
        for (const positive of result.positives) {
            message += `✅ ${positive}\n`;
        }
        message += `\n`;
    }

    message += `Please provide coaching feedback and actionable tips to help improve form.`;

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
