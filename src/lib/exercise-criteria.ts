/**
 * Exercise Criteria System
 * Defines evaluation criteria for each exercise based on angles and metrics
 */

import type { PoseKeypoints } from "./pose-estimation-v2";
import {
    calculateKneeAngle,
    calculateHipAngle,
    getAverageAngle,
    getMinMaxAngle,
    calculateAngleStability,
} from "./angle-calculator";

/**
 * Checkpoint for evaluating a specific aspect of exercise form
 */
export interface Checkpoint {
    name: string;
    description: string;
    metric: "angle" | "range" | "stability";
    calculate: (poses: PoseKeypoints[]) => number | null;
    idealRange: { min: number; max: number };
    severity: (value: number, idealRange: { min: number; max: number }) => CheckpointSeverity;
    feedback: {
        good: string;
        minor: string;
        moderate: string;
        critical: string;
    };
}

export type CheckpointSeverity = "good" | "minor" | "moderate" | "critical";

/**
 * Exercise criteria containing all checkpoints for an exercise
 */
export interface ExerciseCriteria {
    exerciseId: string;
    exerciseName: string;
    checkpoints: Checkpoint[];
}

/**
 * Default severity classifier based on how far value is from ideal range
 */
function defaultSeverityClassifier(
    value: number,
    idealRange: { min: number; max: number }
): CheckpointSeverity {
    const { min, max } = idealRange;
    const midpoint = (min + max) / 2;
    const tolerance = (max - min) / 2;

    // Value is within ideal range
    if (value >= min && value <= max) {
        return "good";
    }

    // Calculate how far outside the range
    const deviation = value < min ? min - value : value - max;
    const deviationPercent = (deviation / tolerance) * 100;

    if (deviationPercent <= 20) return "minor";
    if (deviationPercent <= 50) return "moderate";
    return "critical";
}

/**
 * Leg Extension Exercise Criteria
 */
export const LEG_EXTENSION_CRITERIA: ExerciseCriteria = {
    exerciseId: "leg-extension",
    exerciseName: "Leg Extension",
    checkpoints: [
        {
            name: "Knee Extension Range",
            description: "Maximum knee extension angle at the top of the movement",
            metric: "angle",
            calculate: (poses: PoseKeypoints[]) => {
                // Get knee angles for both legs across all frames
                const leftKneeAngles = poses.map((p) => calculateKneeAngle(p, "left"));
                const rightKneeAngles = poses.map((p) => calculateKneeAngle(p, "right"));

                // Get the maximum extension (highest angle) for each leg
                const leftMax = getMinMaxAngle(leftKneeAngles)?.max;
                const rightMax = getMinMaxAngle(rightKneeAngles)?.max;

                // Return the better of the two legs (some people may be doing single-leg)
                if (leftMax && rightMax) return Math.max(leftMax, rightMax);
                return leftMax || rightMax || null;
            },
            idealRange: { min: 160, max: 180 },
            severity: defaultSeverityClassifier,
            feedback: {
                good: "Excellent knee extension! You're achieving full range of motion.",
                minor: "Good extension, but try to extend a bit more at the top of the movement.",
                moderate: "Your knee extension is limited. Focus on fully extending your legs at the top.",
                critical: "Significant limitation in knee extension. You may need to reduce weight to achieve full range of motion.",
            },
        },
        {
            name: "Starting Position",
            description: "Knee angle at the bottom/starting position",
            metric: "angle",
            calculate: (poses: PoseKeypoints[]) => {
                const leftKneeAngles = poses.map((p) => calculateKneeAngle(p, "left"));
                const rightKneeAngles = poses.map((p) => calculateKneeAngle(p, "right"));

                // Get the minimum angle (most flexed position)
                const leftMin = getMinMaxAngle(leftKneeAngles)?.min;
                const rightMin = getMinMaxAngle(rightKneeAngles)?.min;

                if (leftMin && rightMin) return Math.min(leftMin, rightMin);
                return leftMin || rightMin || null;
            },
            idealRange: { min: 80, max: 100 },
            severity: defaultSeverityClassifier,
            feedback: {
                good: "Perfect starting position with knees at 90 degrees.",
                minor: "Starting position is close to ideal. Ensure knees are bent to about 90 degrees.",
                moderate: "Adjust your starting position - knees should be bent to approximately 90 degrees.",
                critical: "Starting position needs correction. Position the pad so your knees start at 90 degrees flexion.",
            },
        },
        {
            name: "Hip Stability",
            description: "Hip angle should remain stable throughout the movement",
            metric: "stability",
            calculate: (poses: PoseKeypoints[]) => {
                const leftHipAngles = poses.map((p) => calculateHipAngle(p, "left"));
                const rightHipAngles = poses.map((p) => calculateHipAngle(p, "right"));

                // Calculate stability (standard deviation) for both hips
                const leftStability = calculateAngleStability(leftHipAngles);
                const rightStability = calculateAngleStability(rightHipAngles);

                // Return the worse stability (higher value = more movement)
                if (leftStability && rightStability) return Math.max(leftStability, rightStability);
                return leftStability || rightStability || null;
            },
            idealRange: { min: 0, max: 10 }, // Low variance is good
            severity: (value: number, idealRange: { min: number; max: number }) => {
                // For stability, lower is better
                if (value <= idealRange.max) return "good";
                if (value <= 15) return "minor";
                if (value <= 25) return "moderate";
                return "critical";
            },
            feedback: {
                good: "Excellent hip stability! Your hips remain firmly against the back pad.",
                minor: "Good stability, but minimize any hip movement during the exercise.",
                moderate: "Your hips are moving too much. Keep your back firmly against the pad throughout.",
                critical: "Significant hip movement detected. This reduces effectiveness and may cause injury. Keep your back pressed against the pad.",
            },
        },
        {
            name: "Range of Motion",
            description: "Total range of motion from start to finish",
            metric: "range",
            calculate: (poses: PoseKeypoints[]) => {
                const leftKneeAngles = poses.map((p) => calculateKneeAngle(p, "left"));
                const rightKneeAngles = poses.map((p) => calculateKneeAngle(p, "right"));

                const leftRange = getMinMaxAngle(leftKneeAngles)?.range;
                const rightRange = getMinMaxAngle(rightKneeAngles)?.range;

                // Return the better range
                if (leftRange && rightRange) return Math.max(leftRange, rightRange);
                return leftRange || rightRange || null;
            },
            idealRange: { min: 70, max: 100 },
            severity: defaultSeverityClassifier,
            feedback: {
                good: "Great range of motion! You're using the full movement pattern.",
                minor: "Good range, but try to increase it slightly for better quad activation.",
                moderate: "Limited range of motion. Focus on both full extension and proper starting position.",
                critical: "Very limited range of motion. Consider reducing weight to achieve proper form.",
            },
        },
        {
            name: "Movement Control",
            description: "Consistency of movement across repetitions",
            metric: "stability",
            calculate: (poses: PoseKeypoints[]) => {
                // Calculate how consistent the maximum knee angles are across reps
                // This requires detecting peaks in the angle data
                const leftKneeAngles = poses.map((p) => calculateKneeAngle(p, "left")).filter((a): a is number => a !== null);
                const rightKneeAngles = poses.map((p) => calculateKneeAngle(p, "right")).filter((a): a is number => a !== null);

                // Simple approach: calculate variance of all angles
                // Lower variance = more controlled movement
                const allAngles = [...leftKneeAngles, ...rightKneeAngles];
                if (allAngles.length < 2) return null;

                const mean = allAngles.reduce((sum, a) => sum + a, 0) / allAngles.length;
                const variance = allAngles.reduce((sum, a) => sum + (a - mean) ** 2, 0) / allAngles.length;
                return Math.sqrt(variance);
            },
            idealRange: { min: 0, max: 15 },
            severity: (value: number, idealRange: { min: number; max: number }) => {
                if (value <= idealRange.max) return "good";
                if (value <= 25) return "minor";
                if (value <= 40) return "moderate";
                return "critical";
            },
            feedback: {
                good: "Excellent movement control! Your repetitions are consistent and controlled.",
                minor: "Good control, but focus on making each rep identical.",
                moderate: "Movement is somewhat erratic. Slow down and focus on controlled, consistent reps.",
                critical: "Poor movement control detected. You may be using momentum or too much weight. Reduce weight and focus on slow, controlled movements.",
            },
        },
    ],
};

/**
 * Get criteria for a specific exercise
 */
export function getExerciseCriteria(exerciseId: string): ExerciseCriteria | null {
    const criteriaMap: Record<string, ExerciseCriteria> = {
        "leg-extension": LEG_EXTENSION_CRITERIA,
        // Add more exercises here as they're implemented
    };

    return criteriaMap[exerciseId] || null;
}

/**
 * Get all available exercise criteria
 */
export function getAllExerciseCriteria(): ExerciseCriteria[] {
    return [
        LEG_EXTENSION_CRITERIA,
        // Add more as implemented
    ];
}
