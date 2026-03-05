/**
 * Rep Segmentation Module
 * Detects and segments repetitions from pose data using velocity analysis
 */

import type { PoseFrame, Rep, RepSegmentationConfig } from "./types";
import { calculateKneeAngle } from "../angle-calculator";

/**
 * Detect peaks (local maxima) in angle data
 */
function detectPeaks(angles: number[], minDistance: number = 5): number[] {
    const peaks: number[] = [];

    for (let i = 1; i < angles.length - 1; i++) {
        const isPeak = angles[i] > angles[i - 1] && angles[i] > angles[i + 1];

        if (isPeak) {
            // Check minimum distance from last peak
            if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
                peaks.push(i);
            }
        }
    }

    return peaks;
}

/**
 * Detect valleys (local minima) in angle data
 */
function detectValleys(angles: number[], minDistance: number = 5): number[] {
    const valleys: number[] = [];

    for (let i = 1; i < angles.length - 1; i++) {
        const isValley = angles[i] < angles[i - 1] && angles[i] < angles[i + 1];

        if (isValley) {
            // Check minimum distance from last valley
            if (valleys.length === 0 || i - valleys[valleys.length - 1] >= minDistance) {
                valleys.push(i);
            }
        }
    }

    return valleys;
}

/**
 * Segment frames into repetitions using knee angle analysis
 */
export function segmentReps(
    frames: PoseFrame[],
    config: RepSegmentationConfig
): Rep[] {
    if (frames.length < 10) {
        return []; // Not enough data
    }

    // Extract knee angles (use right leg, or left if right not available)
    const kneeAngles: (number | null)[] = frames.map((frame) => {
        const rightKnee = calculateKneeAngle(frame.pose, "right");
        const leftKnee = calculateKneeAngle(frame.pose, "left");
        return rightKnee ?? leftKnee;
    });

    // Filter out null values and their indices
    const validAngles: number[] = [];
    const validIndices: number[] = [];
    kneeAngles.forEach((angle, idx) => {
        if (angle !== null) {
            validAngles.push(angle);
            validIndices.push(idx);
        }
    });

    if (validAngles.length < 10) {
        return []; // Not enough valid data
    }

    // Detect peaks (top of rep - maximum extension) and valleys (bottom - maximum flexion)
    const peaks = detectPeaks(validAngles, 5);
    const valleys = detectValleys(validAngles, 5);

    // Build reps by pairing valleys and peaks
    const reps: Rep[] = [];
    let repNumber = 1;

    for (let i = 0; i < valleys.length; i++) {
        const bottomIdx = validIndices[valleys[i]];

        // Find next peak after this valley
        const nextPeakIdx = peaks.find((p) => p > valleys[i]);
        if (nextPeakIdx === undefined) continue;

        const topIdx = validIndices[nextPeakIdx];

        // Find next valley after the peak (end of rep)
        const nextValleyIdx = valleys.find((v) => v > nextPeakIdx);
        if (nextValleyIdx === undefined && i < valleys.length - 1) continue;

        const endIdx = nextValleyIdx !== undefined ? validIndices[nextValleyIdx] : frames.length - 1;

        // Calculate rep duration
        const duration = frames[endIdx].timestamp - frames[bottomIdx].timestamp;

        // Create rep object
        const rep: Rep = {
            repNumber,
            startFrame: bottomIdx,
            endFrame: endIdx,
            bottomFrame: bottomIdx,
            topFrame: topIdx,
            concentricPhase: {
                start: bottomIdx,
                end: topIdx,
            },
            eccentricPhase: {
                start: topIdx,
                end: endIdx,
            },
            isValid: true,
            invalidReason: undefined,
        };

        // Validate rep
        if (duration < config.minRepDuration) {
            rep.isValid = false;
            rep.invalidReason = "Too fast";
        } else if (duration > config.maxRepDuration) {
            rep.isValid = false;
            rep.invalidReason = "Too slow or incomplete";
        }

        // Check confidence
        const repFrames = frames.slice(bottomIdx, endIdx + 1);
        const avgConfidence =
            repFrames.reduce((sum, f) => sum + f.confidence, 0) / repFrames.length;

        if (avgConfidence < config.minConfidence) {
            rep.isValid = false;
            rep.invalidReason = "Low pose tracking confidence";
        }

        reps.push(rep);
        repNumber++;
    }

    return reps;
}

/**
 * Calculate phase durations for a rep
 */
export function calculatePhaseDurations(
    rep: Rep,
    frames: PoseFrame[]
): { concentric: number; eccentric: number } {
    const concentricDuration =
        frames[rep.concentricPhase.end].timestamp -
        frames[rep.concentricPhase.start].timestamp;

    const eccentricDuration =
        frames[rep.eccentricPhase.end].timestamp -
        frames[rep.eccentricPhase.start].timestamp;

    return {
        concentric: concentricDuration,
        eccentric: eccentricDuration,
    };
}

/**
 * Get default rep segmentation config for leg extension
 */
export function getDefaultLegExtensionConfig(): RepSegmentationConfig {
    return {
        minRepDuration: 1000, // 1 second
        maxRepDuration: 8000, // 8 seconds
        velocityThreshold: 30, // degrees per second
        minConfidence: 0.6, // 60% confidence threshold
    };
}
