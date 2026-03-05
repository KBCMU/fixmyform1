/**
 * Form Evaluation Utilities
 * Helper functions for the form evaluation system
 */

import type { PoseFrame } from "./types";
import type { PoseEstimationResult } from "../pose-estimation-v2";

/**
 * Convert pose estimation results to PoseFrame format
 */
export function convertToPoseFrames(
    poseResults: PoseEstimationResult[]
): PoseFrame[] {
    return poseResults.map((result) => ({
        timestamp: result.timestamp,
        pose: result.keypoints,
        confidence: result.confidence,
    }));
}

/**
 * Calculate average confidence across frames
 */
export function calculateAverageConfidence(frames: PoseFrame[]): number {
    if (frames.length === 0) return 0;
    return frames.reduce((sum, f) => sum + f.confidence, 0) / frames.length;
}
