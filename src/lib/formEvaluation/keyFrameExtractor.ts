/**
 * Key Frame Extractor Module
 * Adapts Medicly's approach for selecting the most mathematically significant frames
 * from a video for multi-modal LLM analysis.
 */

import type { PoseFrame } from "./types";
import { calculateKneeAngle, calculateHipAngle, calculateElbowAngle } from "../angle-calculator";

export interface KeyFrame {
    timestamp: number;
    frameIndex: number;
    pose: PoseFrame;
    type: "start" | "inflection" | "end" | "variance";
    reason: string;
    image?: string; // Base64 image snapshot
}

/**
 * Identify the most significant frames for LLM structural analysis.
 * We want 5 key frames:
 * 1. Start of movement
 * 2. Point of maximum variance (inflection 1)
 * 3. Midpoint/Deepest point of movement (inflection 2)
 * 4. Point of maximum variance (inflection 3)
 * 5. End of movement
 */
export function extractKeyFrames(frames: PoseFrame[], maxFrames: number = 5): KeyFrame[] {
    if (frames.length === 0) return [];
    if (frames.length <= maxFrames) {
        return frames.map((pose, i) => ({
            timestamp: pose.timestamp,
            frameIndex: i,
            pose,
            type: i === 0 ? "start" : i === frames.length - 1 ? "end" : "variance",
            reason: "Low frame count fallback"
        }));
    }

    const keyFrames: KeyFrame[] = [];

    // Always include the first and last frames
    keyFrames.push({
        timestamp: frames[0].timestamp,
        frameIndex: 0,
        pose: frames[0],
        type: "start",
        reason: "Initial resting position"
    });

    // To find the most important middle frames, we analyze movement variance.
    // Calculate total angular variance for each frame compared to its neighbors.
    const variances = frames.map((frame, i) => {
        if (i === 0 || i === frames.length - 1) return 0;

        // Use a 5-frame window to calculate local variance in key joints
        const windowStart = Math.max(0, i - 2);
        const windowEnd = Math.min(frames.length - 1, i + 2);
        const window = frames.slice(windowStart, windowEnd + 1);

        return calculateFrameVariance(window);
    });

    // Find the frame with the absolute maximum variance (usually the hardest part of the rep)
    let maxVariance = 0;
    let maxVarianceIdx = Math.floor(frames.length / 2);

    variances.forEach((v, i) => {
        if (v > maxVariance) {
            maxVariance = v;
            maxVarianceIdx = i;
        }
    });

    // Add the midpoint/max variance frame
    keyFrames.push({
        timestamp: frames[maxVarianceIdx].timestamp,
        frameIndex: maxVarianceIdx,
        pose: frames[maxVarianceIdx],
        type: "inflection",
        reason: "Point of maximum movement/extension"
    });

    // If we need more frames (e.g. 5 total), space them out between start->mid and mid->end
    if (maxFrames > 3) {
        // Find highest variance frame in the first half
        let maxVarBefore = 0;
        let idxBefore = Math.floor(maxVarianceIdx / 2);
        for (let i = 1; i < maxVarianceIdx - 5; i++) {
            if (variances[i] > maxVarBefore) {
                maxVarBefore = variances[i];
                idxBefore = i;
            }
        }

        keyFrames.push({
            timestamp: frames[idxBefore].timestamp,
            frameIndex: idxBefore,
            pose: frames[idxBefore],
            type: "variance",
            reason: "High variance during eccentric/concentric phase"
        });

        // Find highest variance frame in the second half
        let maxVarAfter = 0;
        let idxAfter = Math.floor((maxVarianceIdx + frames.length) / 2);
        for (let i = maxVarianceIdx + 5; i < frames.length - 1; i++) {
            if (variances[i] > maxVarAfter) {
                maxVarAfter = variances[i];
                idxAfter = i;
            }
        }

        keyFrames.push({
            timestamp: frames[idxAfter].timestamp,
            frameIndex: idxAfter,
            pose: frames[idxAfter],
            type: "variance",
            reason: "High variance during eccentric/concentric phase"
        });
    }

    // Always include the last frame
    keyFrames.push({
        timestamp: frames[frames.length - 1].timestamp,
        frameIndex: frames.length - 1,
        pose: frames[frames.length - 1],
        type: "end",
        reason: "Final resting position"
    });

    // Sort by timestamp so they are in chronological order
    return keyFrames.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Calculates a proxy value for how much "movement" is happening in a small window of frames.
 * Helps identify the most dynamic parts of an exercise.
 */
function calculateFrameVariance(windowFrames: PoseFrame[]): number {
    let totalVariance = 0;

    // We look at the primary joints (knees, hips, elbows)
    const joints = [
        { calc: calculateKneeAngle, sides: ["left", "right"] as const },
        { calc: calculateHipAngle, sides: ["left", "right"] as const },
        { calc: calculateElbowAngle, sides: ["left", "right"] as const }
    ];

    for (const joint of joints) {
        for (const side of joint.sides) {
            const angles = windowFrames
                .map(f => joint.calc(f.pose, side))
                .filter((a): a is number => a !== null);

            if (angles.length > 1) {
                const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
                const variance = angles.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / angles.length;
                totalVariance += variance;
            }
        }
    }

    return totalVariance;
}
