/**
 * Pose Analysis Service
 * Analyzes exercise form based on angle-based criteria (no reference video comparison)
 */

import type { PoseKeypoints } from "./pose-estimation-v2";
import { getExerciseCriteria, type Checkpoint, type CheckpointSeverity } from "./exercise-criteria";

/**
 * Result of analyzing a single checkpoint
 */
export interface CheckpointResult {
    checkpoint: string;
    description: string;
    value: number | null;
    idealRange: { min: number; max: number };
    severity: CheckpointSeverity;
    feedback: string;
    metric: "angle" | "range" | "stability";
}

/**
 * Complete analysis result for an exercise
 */
export interface ExerciseAnalysisResult {
    exerciseId: string;
    exerciseName: string;
    formScore: number; // 0-100
    checkpointResults: CheckpointResult[];
    overallFeedback: string;
    criticalIssues: string[];
    minorIssues: string[];
}

/**
 * Analyze exercise form based on pose keypoints and exercise-specific criteria
 */
export function analyzeExerciseForm(
    exerciseId: string,
    userPoses: PoseKeypoints[]
): ExerciseAnalysisResult {
    // Get criteria for this exercise
    const criteria = getExerciseCriteria(exerciseId);

    if (!criteria) {
        throw new Error(`No criteria defined for exercise: ${exerciseId}`);
    }

    if (userPoses.length === 0) {
        throw new Error("No pose data provided for analysis");
    }

    // Evaluate each checkpoint
    const checkpointResults: CheckpointResult[] = [];
    const criticalIssues: string[] = [];
    const minorIssues: string[] = [];

    for (const checkpoint of criteria.checkpoints) {
        const result = evaluateCheckpoint(checkpoint, userPoses);
        checkpointResults.push(result);

        // Categorize issues
        if (result.severity === "critical") {
            criticalIssues.push(result.feedback);
        } else if (result.severity === "minor" || result.severity === "moderate") {
            minorIssues.push(result.feedback);
        }
    }

    // Calculate overall form score
    const formScore = calculateFormScore(checkpointResults);

    // Generate overall feedback
    const overallFeedback = generateOverallFeedback(formScore, checkpointResults);

    return {
        exerciseId: criteria.exerciseId,
        exerciseName: criteria.exerciseName,
        formScore,
        checkpointResults,
        overallFeedback,
        criticalIssues,
        minorIssues,
    };
}

/**
 * Evaluate a single checkpoint
 */
function evaluateCheckpoint(
    checkpoint: Checkpoint,
    poses: PoseKeypoints[]
): CheckpointResult {
    // Calculate the metric value
    const value = checkpoint.calculate(poses);

    // Determine severity
    const severity: CheckpointSeverity = value !== null
        ? checkpoint.severity(value, checkpoint.idealRange)
        : "critical"; // If we can't calculate, it's critical

    // Get appropriate feedback
    const feedback = value !== null
        ? checkpoint.feedback[severity]
        : "Unable to detect this aspect of your form. Ensure your full body is visible in the video.";

    return {
        checkpoint: checkpoint.name,
        description: checkpoint.description,
        value,
        idealRange: checkpoint.idealRange,
        severity,
        feedback,
        metric: checkpoint.metric,
    };
}

/**
 * Calculate overall form score (0-100) based on checkpoint results
 */
function calculateFormScore(checkpointResults: CheckpointResult[]): number {
    if (checkpointResults.length === 0) return 0;

    // Assign points based on severity
    const severityPoints: Record<CheckpointSeverity, number> = {
        good: 100,
        minor: 75,
        moderate: 50,
        critical: 25,
    };

    // Calculate weighted average
    const totalPoints = checkpointResults.reduce((sum, result) => {
        return sum + severityPoints[result.severity];
    }, 0);

    const maxPoints = checkpointResults.length * 100;
    const score = (totalPoints / maxPoints) * 100;

    return Math.round(score);
}

/**
 * Generate overall feedback summary
 */
function generateOverallFeedback(
    formScore: number,
    checkpointResults: CheckpointResult[]
): string {
    const goodCount = checkpointResults.filter((r) => r.severity === "good").length;
    const criticalCount = checkpointResults.filter((r) => r.severity === "critical").length;
    const moderateCount = checkpointResults.filter((r) => r.severity === "moderate").length;

    if (formScore >= 90) {
        return `Excellent form! ${goodCount} out of ${checkpointResults.length} checkpoints are perfect. Keep up the great work!`;
    } else if (formScore >= 75) {
        return `Good form overall! You're doing well on most aspects, with ${goodCount} checkpoints in the ideal range. Focus on the areas marked for improvement.`;
    } else if (formScore >= 60) {
        return `Decent form, but there's room for improvement. ${moderateCount + criticalCount} checkpoints need attention. Review the feedback below carefully.`;
    } else if (formScore >= 40) {
        return `Your form needs significant improvement. ${criticalCount} critical issues detected. Consider reducing weight and focusing on proper technique.`;
    } else {
        return `Form requires major corrections. Multiple critical issues detected. We recommend working with a trainer or reducing weight significantly to master proper form.`;
    }
}

/**
 * Format checkpoint result for display
 */
export function formatCheckpointValue(result: CheckpointResult): string {
    if (result.value === null) {
        return "N/A";
    }

    const unit = result.metric === "angle" || result.metric === "range" ? "°" : "";
    return `${Math.round(result.value)}${unit}`;
}

/**
 * Get color/status indicator for severity
 */
export function getSeverityColor(severity: CheckpointSeverity): string {
    const colors: Record<CheckpointSeverity, string> = {
        good: "green",
        minor: "yellow",
        moderate: "orange",
        critical: "red",
    };
    return colors[severity];
}

/**
 * Get emoji indicator for severity
 */
export function getSeverityEmoji(severity: CheckpointSeverity): string {
    const emojis: Record<CheckpointSeverity, string> = {
        good: "✅",
        minor: "⚠️",
        moderate: "⚠️",
        critical: "❌",
    };
    return emojis[severity];
}
