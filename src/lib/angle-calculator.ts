/**
 * Angle Calculator
 * Utilities for calculating angles and metrics from pose landmarks
 */

import type { PoseKeypoints, Landmark } from "./pose-estimation-v2";

/**
 * Calculate the angle at point2 formed by three points (in degrees)
 * @param point1 - First point
 * @param point2 - Vertex point (where angle is measured)
 * @param point3 - Third point
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(
    point1: Landmark,
    point2: Landmark,
    point3: Landmark
): number {
    // Calculate vectors
    const vector1 = {
        x: point1.x - point2.x,
        y: point1.y - point2.y,
        z: (point1.z ?? 0) - (point2.z ?? 0),
    };

    const vector2 = {
        x: point3.x - point2.x,
        y: point3.y - point2.y,
        z: (point3.z ?? 0) - (point2.z ?? 0),
    };

    // Calculate dot product
    const dotProduct =
        vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;

    // Calculate magnitudes
    const magnitude1 = Math.sqrt(
        vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2
    );
    const magnitude2 = Math.sqrt(
        vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2
    );

    // Calculate angle in radians then convert to degrees
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp to [-1, 1]
    const angleDegrees = (angleRadians * 180) / Math.PI;

    return angleDegrees;
}

/**
 * Calculate knee angle for a given side
 * @param pose - Pose keypoints
 * @param side - 'left' or 'right'
 * @returns Knee angle in degrees, or null if landmarks missing
 */
export function calculateKneeAngle(
    pose: PoseKeypoints,
    side: "left" | "right"
): number | null {
    const hip = side === "left" ? pose.leftHip : pose.rightHip;
    const knee = side === "left" ? pose.leftKnee : pose.rightKnee;
    const ankle = side === "left" ? pose.leftAnkle : pose.rightAnkle;

    if (!hip || !knee || !ankle) {
        return null;
    }

    return calculateAngle(hip, knee, ankle);
}

/**
 * Calculate hip angle for a given side
 * @param pose - Pose keypoints
 * @param side - 'left' or 'right'
 * @returns Hip angle in degrees, or null if landmarks missing
 */
export function calculateHipAngle(
    pose: PoseKeypoints,
    side: "left" | "right"
): number | null {
    const shoulder = side === "left" ? pose.leftShoulder : pose.rightShoulder;
    const hip = side === "left" ? pose.leftHip : pose.rightHip;
    const knee = side === "left" ? pose.leftKnee : pose.rightKnee;

    if (!shoulder || !hip || !knee) {
        return null;
    }

    return calculateAngle(shoulder, hip, knee);
}

/**
 * Calculate ankle angle (dorsiflexion/plantarflexion)
 * Note: Using knee-ankle-hip alignment as MediaPipe doesn't provide foot landmarks in our interface
 * @param pose - Pose keypoints
 * @param side - 'left' or 'right'
 * @returns Ankle angle in degrees, or null if landmarks missing
 */
export function calculateAnkleAngle(
    pose: PoseKeypoints,
    side: "left" | "right"
): number | null {
    const knee = side === "left" ? pose.leftKnee : pose.rightKnee;
    const ankle = side === "left" ? pose.leftAnkle : pose.rightAnkle;
    const hip = side === "left" ? pose.leftHip : pose.rightHip;

    if (!knee || !ankle || !hip) {
        return null;
    }

    return calculateAngle(knee, ankle, hip);
}

/**
 * Calculate elbow angle for a given side
 * @param pose - Pose keypoints
 * @param side - 'left' or 'right'
 * @returns Elbow angle in degrees, or null if landmarks missing
 */
export function calculateElbowAngle(
    pose: PoseKeypoints,
    side: "left" | "right"
): number | null {
    const shoulder = side === "left" ? pose.leftShoulder : pose.rightShoulder;
    const elbow = side === "left" ? pose.leftElbow : pose.rightElbow;
    const wrist = side === "left" ? pose.leftWrist : pose.rightWrist;

    if (!shoulder || !elbow || !wrist) {
        return null;
    }

    return calculateAngle(shoulder, elbow, wrist);
}

/**
 * Calculate average angle from an array of angles
 * @param angles - Array of angles (nulls are filtered out)
 * @returns Average angle, or null if no valid angles
 */
export function getAverageAngle(angles: (number | null)[]): number | null {
    const validAngles = angles.filter((a): a is number => a !== null);
    if (validAngles.length === 0) return null;

    const sum = validAngles.reduce((acc, angle) => acc + angle, 0);
    return sum / validAngles.length;
}

/**
 * Get minimum and maximum angles from an array
 * @param angles - Array of angles (nulls are filtered out)
 * @returns Object with min and max, or null if no valid angles
 */
export function getMinMaxAngle(
    angles: (number | null)[]
): { min: number; max: number; range: number } | null {
    const validAngles = angles.filter((a): a is number => a !== null);
    if (validAngles.length === 0) return null;

    const min = Math.min(...validAngles);
    const max = Math.max(...validAngles);
    const range = max - min;

    return { min, max, range };
}

/**
 * Calculate range of motion for a joint across multiple frames
 * @param poses - Array of pose keypoints
 * @param calculateJointAngle - Function to calculate the joint angle
 * @returns Range of motion statistics
 */
export function calculateRangeOfMotion(
    poses: PoseKeypoints[],
    calculateJointAngle: (pose: PoseKeypoints) => number | null
): {
    min: number;
    max: number;
    range: number;
    average: number;
} | null {
    const angles = poses.map(calculateJointAngle);
    const minMax = getMinMaxAngle(angles);
    const average = getAverageAngle(angles);

    if (!minMax || average === null) return null;

    return {
        ...minMax,
        average,
    };
}

/**
 * Calculate the stability (variance) of an angle across frames
 * Lower values indicate more stable position
 * @param angles - Array of angles
 * @returns Standard deviation, or null if insufficient data
 */
export function calculateAngleStability(
    angles: (number | null)[]
): number | null {
    const validAngles = angles.filter((a): a is number => a !== null);
    if (validAngles.length < 2) return null;

    const mean = validAngles.reduce((sum, a) => sum + a, 0) / validAngles.length;
    const variance =
        validAngles.reduce((sum, a) => sum + (a - mean) ** 2, 0) /
        validAngles.length;
    const stdDev = Math.sqrt(variance);

    return stdDev;
}

/**
 * Calculate distance between two landmarks
 * @param point1 - First landmark
 * @param point2 - Second landmark
 * @returns Euclidean distance
 */
export function calculateDistance(point1: Landmark, point2: Landmark): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z ?? 0) - (point2.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
