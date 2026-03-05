/**
 * Reference Video Database
 * In production, this would be stored in Vectorize + D1
 * For now, we'll use mock reference poses
 */

import type { PoseKeypoints } from "./pose-estimation-v2";

export interface ReferenceVideo {
  id: string;
  exerciseId: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  poses: PoseKeypoints[]; // Keyframes from the video
  averagePose: PoseKeypoints; // Average/representative pose
  metadata: {
    duration: number; // seconds
    frameCount: number;
    quality: "high" | "medium";
  };
}

/**
 * Generate mock reference poses for an exercise
 * In production, these would be actual extracted poses from reference videos
 */
export function generateMockReferencePoses(exerciseId: string): PoseKeypoints[] {
  void exerciseId;
  // Generate 5 keyframes representing good form
  return [
    generateMockPose(0.3, 0.4), // Starting position
    generateMockPose(0.4, 0.5), // Quarter movement
    generateMockPose(0.5, 0.6), // Mid-point
    generateMockPose(0.4, 0.5), // Quarter return
    generateMockPose(0.3, 0.4), // End position
  ];
}

/**
 * Generate a mock pose with reasonable proportions
 */
function generateMockPose(verticalOffset: number, armHeight: number): PoseKeypoints {
  return {
    nose: { x: 0.5, y: 0.2 + verticalOffset, z: 0, visibility: 0.95 },
    leftEye: { x: 0.48, y: 0.18 + verticalOffset, z: 0, visibility: 0.95 },
    rightEye: { x: 0.52, y: 0.18 + verticalOffset, z: 0, visibility: 0.95 },
    leftEar: { x: 0.46, y: 0.2 + verticalOffset, z: 0, visibility: 0.9 },
    rightEar: { x: 0.54, y: 0.2 + verticalOffset, z: 0, visibility: 0.9 },
    leftShoulder: { x: 0.42, y: 0.3 + verticalOffset, z: 0, visibility: 0.95 },
    rightShoulder: { x: 0.58, y: 0.3 + verticalOffset, z: 0, visibility: 0.95 },
    leftElbow: { x: 0.35, y: armHeight + verticalOffset, z: 0, visibility: 0.9 },
    rightElbow: { x: 0.65, y: armHeight + verticalOffset, z: 0, visibility: 0.9 },
    leftWrist: { x: 0.3, y: 0.55 + verticalOffset, z: 0, visibility: 0.85 },
    rightWrist: { x: 0.7, y: 0.55 + verticalOffset, z: 0, visibility: 0.85 },
    leftHip: { x: 0.44, y: 0.55 + verticalOffset, z: 0, visibility: 0.95 },
    rightHip: { x: 0.56, y: 0.55 + verticalOffset, z: 0, visibility: 0.95 },
    leftKnee: { x: 0.44, y: 0.7 + verticalOffset, z: 0, visibility: 0.9 },
    rightKnee: { x: 0.56, y: 0.7 + verticalOffset, z: 0, visibility: 0.9 },
    leftAnkle: { x: 0.44, y: 0.85 + verticalOffset, z: 0, visibility: 0.9 },
    rightAnkle: { x: 0.56, y: 0.85 + verticalOffset, z: 0, visibility: 0.9 },
  };
}

/**
 * Get reference videos for an exercise
 * In production, this would query Vectorize + D1
 */
export async function getReferencePosesForExercise(
  exerciseId: string
): Promise<PoseKeypoints[]> {
  // Simulate database query
  await new Promise((resolve) => setTimeout(resolve, 300));

  return generateMockReferencePoses(exerciseId);
}

/**
 * In production: Store reference video in database
 */
export async function storeReferenceVideo(
  video: ReferenceVideo
): Promise<void> {
  // Would store in:
  // 1. R2: video file
  // 2. D1: metadata
  // 3. Vectorize: pose embeddings
  console.log("Storing reference video:", video.id);
}

