/**
 * Form Evaluation Types
 * Core interfaces for the deterministic form evaluation system
 */

import type { PoseKeypoints } from "../pose-estimation-v2";

/**
 * A single frame of pose data with timestamp and confidence
 */
export interface PoseFrame {
    timestamp: number; // milliseconds
    pose: PoseKeypoints;
    confidence: number; // average confidence across all joints
}

/**
 * A detected repetition with phase information
 */
export interface Rep {
    repNumber: number;
    startFrame: number;
    endFrame: number;
    bottomFrame: number; // frame at maximum knee flexion
    topFrame: number; // frame at maximum knee extension
    concentricPhase: { start: number; end: number };
    eccentricPhase: { start: number; end: number };
    isValid: boolean;
    invalidReason?: string;
}

/**
 * A form issue detected during evaluation
 */
export interface FormIssue {
    name: string;
    severity: "minor" | "moderate" | "severe";
    affectedReps: number; // count of reps with this issue
    confidence: number; // 0-1, weighted by pose tracking confidence
    description?: string; // human-readable description
}

/**
 * Positive aspects of form
 */
export interface FormPositive {
    aspect: string;
    description: string;
}

/**
 * Complete form evaluation result
 */
export interface FormEvaluationResult {
    exercise: string; // e.g., "leg_extension"
    totalReps: number;
    validReps: number;
    issues: FormIssue[];
    positives: string[];
    overallScore: number; // 0-100
    formScore?: number; // legacy compatibility
    cameraSetupIssue?: string; // if confidence too low
}

/**
 * Configuration for rep segmentation
 */
export interface RepSegmentationConfig {
    minRepDuration: number; // milliseconds
    maxRepDuration: number; // milliseconds
    velocityThreshold: number; // degrees per second
    minConfidence: number; // minimum average confidence to consider valid
}

/**
 * Generic exercise evaluator interface
 */
export interface ExerciseEvaluator {
    exerciseName: string;

    /**
     * Evaluate form from pose frames
     */
    evaluate(frames: PoseFrame[]): FormEvaluationResult;

    /**
     * Segment frames into reps
     */
    segmentReps(frames: PoseFrame[]): Rep[];

    /**
     * Validate a single rep
     */
    validateRep(rep: Rep, frames: PoseFrame[]): boolean;
}
