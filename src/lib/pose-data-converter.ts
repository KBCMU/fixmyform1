/**
 * Convert between different pose data formats
 * Handles conversion between MediaPipe landmarks array and PoseKeypoints format
 */

import type { PoseKeypoints } from "./pose-estimation-v2";

/**
 * Convert MediaPipe landmarks array to PoseKeypoints format
 * Reference poses from Supabase are stored as { landmarks: [...] }
 */
export function convertLandmarksToPoseKeypoints(landmarks: Array<{
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}>): PoseKeypoints {
  const keypoints: PoseKeypoints = {};

  // Map MediaPipe landmark indices to our PoseKeypoints format
  const landmarkIndices = {
    nose: 0,
    leftEye: 2,
    rightEye: 5,
    leftEar: 7,
    rightEar: 8,
    leftShoulder: 11,
    rightShoulder: 12,
    leftElbow: 13,
    rightElbow: 14,
    leftWrist: 15,
    rightWrist: 16,
    leftHip: 23,
    rightHip: 24,
    leftKnee: 25,
    rightKnee: 26,
    leftAnkle: 27,
    rightAnkle: 28,
  };

  Object.entries(landmarkIndices).forEach(([key, index]) => {
    const landmark = landmarks[index];
    // Relaxed validation: allow normalized coordinates (0-1) and check visibility
    // Don't require x > 0 and y > 0 as normalized coords can be 0
    if (landmark &&
      typeof landmark.x === 'number' &&
      typeof landmark.y === 'number' &&
      !isNaN(landmark.x) &&
      !isNaN(landmark.y) &&
      (landmark.visibility === undefined || landmark.visibility > 0.1)) {
      keypoints[key as keyof PoseKeypoints] = {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z ?? 0,
        visibility: landmark.visibility,
      };
    }
  });

  return keypoints;
}

/**
 * Convert pose_data from Supabase (which may be in different formats) to PoseKeypoints
 */
export function convertPoseDataToPoseKeypoints(poseData: unknown): PoseKeypoints {
  if (!poseData || typeof poseData !== 'object') return {};
  const data = poseData as Record<string, unknown>;

  // If it's already in PoseKeypoints format
  if (data.leftShoulder || data.rightShoulder) {
    return poseData as PoseKeypoints;
  }

  // If it has landmarks array (MediaPipe format)
  if (data.landmarks && Array.isArray(data.landmarks)) {
    return convertLandmarksToPoseKeypoints(data.landmarks);
  }

  // If it's a raw array of landmarks
  if (Array.isArray(poseData)) {
    return convertLandmarksToPoseKeypoints(poseData);
  }

  // Fallback: return empty keypoints
  console.warn("Unknown pose data format, returning empty keypoints");
  return {};
}
