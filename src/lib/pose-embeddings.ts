/**
 * Pose Embedding Utilities
 * 
 * Converts pose keypoints to embeddings suitable for Vectorize similarity search
 */

import type { PoseKeypoints, Landmark } from "./pose-estimation-v2";

/**
 * Generate a simple embedding vector from pose keypoints
 * This creates a normalized feature vector suitable for similarity search
 */
export function generatePoseEmbedding(keypoints: PoseKeypoints): number[] {
  const embedding: number[] = [];

  // Extract key joint positions (17 main joints for COCO format compatibility)
  const mainJoints: Array<keyof PoseKeypoints> = [
    "nose",
    "leftEye",
    "rightEye",
    "leftEar",
    "rightEar",
    "leftShoulder",
    "rightShoulder",
    "leftElbow",
    "rightElbow",
    "leftWrist",
    "rightWrist",
    "leftHip",
    "rightHip",
    "leftKnee",
    "rightKnee",
    "leftAnkle",
    "rightAnkle",
  ];

  // Add position coordinates
  mainJoints.forEach((joint) => {
    const landmark = keypoints[joint];
    if (landmark) {
      embedding.push(landmark.x, landmark.y, landmark.z ?? 0);
    } else {
      embedding.push(0, 0, 0);
    }
  });

  // Calculate joint angles for better pose representation
  const angles = calculateJointAngles(keypoints);
  embedding.push(...angles);

  // Normalize the embedding
  return normalizeVector(embedding);
}

/**
 * Calculate key joint angles from pose keypoints
 */
function calculateJointAngles(keypoints: PoseKeypoints): number[] {
  const angles: number[] = [];

  // Helper function to calculate angle between three points
  const angleBetween = (
    p1: Landmark,
    p2: Landmark,
    p3: Landmark
  ): number => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) return 0;

    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  };

  // Calculate key angles
  if (
    keypoints.leftShoulder &&
    keypoints.leftElbow &&
    keypoints.leftWrist
  ) {
    angles.push(
      angleBetween(
        keypoints.leftShoulder,
        keypoints.leftElbow,
        keypoints.leftWrist
      )
    );
  } else {
    angles.push(0);
  }

  if (
    keypoints.rightShoulder &&
    keypoints.rightElbow &&
    keypoints.rightWrist
  ) {
    angles.push(
      angleBetween(
        keypoints.rightShoulder,
        keypoints.rightElbow,
        keypoints.rightWrist
      )
    );
  } else {
    angles.push(0);
  }

  if (keypoints.leftHip && keypoints.leftKnee && keypoints.leftAnkle) {
    angles.push(
      angleBetween(keypoints.leftHip, keypoints.leftKnee, keypoints.leftAnkle)
    );
  } else {
    angles.push(0);
  }

  if (keypoints.rightHip && keypoints.rightKnee && keypoints.rightAnkle) {
    angles.push(
      angleBetween(
        keypoints.rightHip,
        keypoints.rightKnee,
        keypoints.rightAnkle
      )
    );
  } else {
    angles.push(0);
  }

  // Torso angle
  if (
    keypoints.leftShoulder &&
    keypoints.leftHip &&
    keypoints.leftKnee
  ) {
    angles.push(
      angleBetween(
        keypoints.leftShoulder,
        keypoints.leftHip,
        keypoints.leftKnee
      )
    );
  } else {
    angles.push(0);
  }

  return angles;
}

/**
 * Normalize a vector to unit length
 */
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  );

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((val) => val / magnitude);
}

/**
 * Calculate cosine similarity between two pose embeddings
 */
export function cosineSimilarity(
  embedding1: number[],
  embedding2: number[]
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Calculate pose difference score (0-1, where 0 is identical, 1 is completely different)
 */
export function poseDifferenceScore(
  embedding1: number[],
  embedding2: number[]
): number {
  const similarity = cosineSimilarity(embedding1, embedding2);
  return 1 - (similarity + 1) / 2; // Convert from [-1, 1] to [0, 1]
}

/**
 * Generate embedding suitable for Vectorize (128 dimensions)
 * Pads or truncates to exactly 128 dimensions
 */
export function generateVectorizeEmbedding(
  keypoints: PoseKeypoints,
  targetDimensions: number = 128
): number[] {
  const baseEmbedding = generatePoseEmbedding(keypoints);

  // Pad or truncate to target dimensions
  if (baseEmbedding.length < targetDimensions) {
    // Pad with zeros
    return [
      ...baseEmbedding,
      ...new Array(targetDimensions - baseEmbedding.length).fill(0),
    ];
  } else if (baseEmbedding.length > targetDimensions) {
    // Truncate
    return baseEmbedding.slice(0, targetDimensions);
  }

  return baseEmbedding;
}

