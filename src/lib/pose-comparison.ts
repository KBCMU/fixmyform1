/**
 * Pose Comparison Service
 * Compares user poses with reference poses and identifies differences
 */

import type { PoseKeypoints, Landmark } from "./pose-estimation-v2";
import { cosineSimilarity, generatePoseEmbedding } from "./pose-embeddings";

export interface PoseComparisonResult {
  overallSimilarity: number; // 0-1, 1 being identical
  formScore: number; // 0-100
  jointDifferences: JointDifference[];
  criticalIssues: string[];
  minorIssues: string[];
}

export interface JointDifference {
  joint: string;
  angleDifference: number; // in degrees
  positionDifference: number; // normalized 0-1
  severity: "good" | "minor" | "moderate" | "critical";
  description: string;
}

/**
 * Compare user pose with reference pose
 */
export function comparePoses(
  userPose: PoseKeypoints,
  referencePose: PoseKeypoints
): PoseComparisonResult {
  // Normalize coordinate systems to ensure consistent comparison
  const normalizedUserPose = normalizePoseCoordinates(userPose);
  const normalizedRefPose = normalizePoseCoordinates(referencePose);

  // Calculate embeddings
  const userEmbedding = generatePoseEmbedding(normalizedUserPose);
  const referenceEmbedding = generatePoseEmbedding(normalizedRefPose);

  // Calculate overall similarity
  const similarity = cosineSimilarity(userEmbedding, referenceEmbedding);
  const overallSimilarity = Math.max(0, Math.min(1, (similarity + 1) / 2));

  // Calculate joint-level differences (using normalized poses)
  const jointDifferences = calculateJointDifferences(normalizedUserPose, normalizedRefPose);

  // Categorize issues
  const criticalIssues: string[] = [];
  const minorIssues: string[] = [];

  jointDifferences.forEach((diff) => {
    if (diff.severity === "critical") {
      criticalIssues.push(diff.description);
    } else if (diff.severity === "minor" || diff.severity === "moderate") {
      minorIssues.push(diff.description);
    }
  });

  // Calculate form score (0-100)
  const formScore = calculateFormScore(overallSimilarity, jointDifferences);

  return {
    overallSimilarity,
    formScore,
    jointDifferences,
    criticalIssues,
    minorIssues,
  };
}

/**
 * Calculate differences for each joint
 */
function calculateJointDifferences(
  userPose: PoseKeypoints,
  referencePose: PoseKeypoints
): JointDifference[] {
  const differences: JointDifference[] = [];
  const missingJoints: string[] = [];

  // Check key joints
  const keyJoints: Array<{
    name: string;
    user: keyof PoseKeypoints;
    ref: keyof PoseKeypoints;
    importance: number;
  }> = [
      { name: "Left Shoulder", user: "leftShoulder", ref: "leftShoulder", importance: 0.9 },
      { name: "Right Shoulder", user: "rightShoulder", ref: "rightShoulder", importance: 0.9 },
      { name: "Left Elbow", user: "leftElbow", ref: "leftElbow", importance: 0.8 },
      { name: "Right Elbow", user: "rightElbow", ref: "rightElbow", importance: 0.8 },
      { name: "Left Hip", user: "leftHip", ref: "leftHip", importance: 1.0 },
      { name: "Right Hip", user: "rightHip", ref: "rightHip", importance: 1.0 },
      { name: "Left Knee", user: "leftKnee", ref: "leftKnee", importance: 0.9 },
      { name: "Right Knee", user: "rightKnee", ref: "rightKnee", importance: 0.9 },
    ];

  keyJoints.forEach(({ name, user, ref, importance }) => {
    const userJoint = userPose[user];
    const refJoint = referencePose[ref];

    if (userJoint && refJoint) {
      const positionDiff = calculateDistance(userJoint, refJoint);
      const angleDiff = calculateAngleDifference(userJoint, refJoint) * importance;

      const severity = classifySeverity(positionDiff, angleDiff);
      const description = generateDescription(name, positionDiff, angleDiff, severity);

      differences.push({
        joint: name,
        angleDifference: angleDiff,
        positionDifference: positionDiff,
        severity,
        description,
      });
    } else {
      if (!userJoint) missingJoints.push(`user:${name}`);
      if (!refJoint) missingJoints.push(`ref:${name}`);
    }
  });

  return differences;
}

/**
 * Normalize pose coordinates to ensure consistent scale
 * Detects if coordinates are in normalized (0-1) or pixel space
 */
function normalizePoseCoordinates(pose: PoseKeypoints): PoseKeypoints {
  // If pose is empty, return as-is
  if (!pose || Object.keys(pose).length === 0) {
    return pose;
  }

  const normalized: PoseKeypoints = { ...pose };

  // Check if coordinates are already normalized (typically 0-1 range)
  // If any coordinate > 1, assume pixel space and normalize
  let maxCoord = 0;
  Object.values(pose).forEach(landmark => {
    if (landmark && typeof landmark.x === 'number' && typeof landmark.y === 'number') {
      maxCoord = Math.max(maxCoord, Math.abs(landmark.x), Math.abs(landmark.y), Math.abs(landmark.z ?? 0));
    }
  });

  // If coordinates are in pixel space (> 1) and we have a valid scale, normalize them
  if (maxCoord > 1 && maxCoord > 0 && isFinite(maxCoord)) {
    const scale = maxCoord;
    Object.keys(pose).forEach(key => {
      const landmark = pose[key as keyof PoseKeypoints];
      if (landmark && typeof landmark.x === 'number' && typeof landmark.y === 'number') {
        normalized[key as keyof PoseKeypoints] = {
          ...landmark,
          x: landmark.x / scale,
          y: landmark.y / scale,
          z: (landmark.z ?? 0) / scale,
        };
      }
    });
  }

  return normalized;
}

/**
 * Calculate Euclidean distance between two landmarks
 * Assumes both landmarks are in the same coordinate system (normalized)
 */
function calculateDistance(landmark1: Landmark, landmark2: Landmark): number {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = (landmark1.z ?? 0) - (landmark2.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate angle difference (simplified)
 */
function calculateAngleDifference(landmark1: Landmark, landmark2: Landmark): number {
  // Simplified angle calculation
  const angle1 = Math.atan2(landmark1.y, landmark1.x);
  const angle2 = Math.atan2(landmark2.y, landmark2.x);
  let diff = Math.abs(angle1 - angle2) * (180 / Math.PI);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Classify severity of difference
 * Adjusted thresholds to be more realistic for pose variations
 * Position differences are normalized (0-1), so thresholds are relative
 */
function classifySeverity(
  positionDiff: number,
  angleDiff: number
): "good" | "minor" | "moderate" | "critical" {
  // More lenient thresholds - account for natural variation
  // Position diff thresholds: 0.05 -> 0.1, 0.1 -> 0.15, 0.2 -> 0.3
  // Angle diff thresholds: 10 -> 15, 20 -> 25, 35 -> 45
  if (positionDiff < 0.1 && angleDiff < 15) return "good";
  if (positionDiff < 0.15 && angleDiff < 25) return "minor";
  if (positionDiff < 0.3 && angleDiff < 45) return "moderate";
  return "critical";
}

/**
 * Generate human-readable description
 */
function generateDescription(
  joint: string,
  positionDiff: number,
  angleDiff: number,
  severity: string
): string {
  const angle = Math.round(angleDiff);

  if (severity === "good") {
    return `${joint} position is correct`;
  } else if (severity === "minor") {
    return `${joint} is slightly off (${angle}° difference)`;
  } else if (severity === "moderate") {
    return `${joint} needs adjustment (${angle}° difference)`;
  } else {
    return `${joint} has significant form issue (${angle}° difference)`;
  }
}

/**
 * Calculate overall form score (0-100)
 */
function calculateFormScore(
  similarity: number,
  differences: JointDifference[]
): number {
  // Start with similarity-based score
  let score = similarity * 100;

  // Penalize based on severity (reduced penalties to prevent over-penalization)
  differences.forEach((diff) => {
    if (diff.severity === "critical") score -= 10; // Reduced from 15
    else if (diff.severity === "moderate") score -= 5; // Reduced from 8
    else if (diff.severity === "minor") score -= 2; // Reduced from 3
  });

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return finalScore;
}

/**
 * Compare user poses across video frames with multiple reference poses
 */
export function compareVideoWithReferences(
  userPoses: PoseKeypoints[],
  referencePoses: PoseKeypoints[]
): PoseComparisonResult {
  // Validate inputs
  if (userPoses.length === 0) {
    throw new Error("No user poses available for comparison");
  }
  if (referencePoses.length === 0) {
    throw new Error("No reference poses available for comparison");
  }

  try {
    // Find best matching reference for each user pose
    // Limit processing to prevent UI blocking - sample poses if too many
    const maxUserPoses = 50; // Limit to prevent performance issues
    const maxRefPoses = 20; // Limit reference poses for comparison
    const sampledUserPoses = userPoses.slice(0, maxUserPoses);
    const sampledRefPoses = referencePoses.slice(0, maxRefPoses);

    const comparisons = sampledUserPoses.map((userPose) => {
      try {
        const bestMatch = sampledRefPoses
          .map((refPose) => {
            try {
              return comparePoses(userPose, refPose);
            } catch {
              // Return a default comparison result on error
              return {
                overallSimilarity: 0,
                formScore: 0,
                jointDifferences: [],
                criticalIssues: [],
                minorIssues: [],
              };
            }
          })
          .sort((a, b) => b.overallSimilarity - a.overallSimilarity)[0];

        return bestMatch;
      } catch {
        return {
          overallSimilarity: 0,
          formScore: 0,
          jointDifferences: [],
          criticalIssues: [],
          minorIssues: [],
        };
      }
    });

    // Aggregate results
    const avgSimilarity =
      comparisons.reduce((sum, c) => sum + c.overallSimilarity, 0) / comparisons.length;
    const avgFormScore =
      comparisons.reduce((sum, c) => sum + c.formScore, 0) / comparisons.length;

    // Collect all unique issues
    const allCriticalIssues = new Set<string>();
    const allMinorIssues = new Set<string>();

    comparisons.forEach((comp) => {
      comp.criticalIssues.forEach((issue) => allCriticalIssues.add(issue));
      comp.minorIssues.forEach((issue) => allMinorIssues.add(issue));
    });

    // Get most common joint differences
    const jointDiffMap = new Map<string, JointDifference[]>();
    comparisons.forEach((comp) => {
      comp.jointDifferences.forEach((diff) => {
        if (!jointDiffMap.has(diff.joint)) {
          jointDiffMap.set(diff.joint, []);
        }
        jointDiffMap.get(diff.joint)!.push(diff);
      });
    });

    const averagedJointDiffs: JointDifference[] = [];
    jointDiffMap.forEach((diffs, joint) => {
      const avgAngle = diffs.reduce((sum, d) => sum + d.angleDifference, 0) / diffs.length;
      const avgPos = diffs.reduce((sum, d) => sum + d.positionDifference, 0) / diffs.length;
      const worstSeverity = diffs.reduce((worst, d) => {
        const severityRank = { good: 0, minor: 1, moderate: 2, critical: 3 };
        return severityRank[d.severity] > severityRank[worst]
          ? d.severity
          : worst;
      }, "good" as JointDifference["severity"]);

      averagedJointDiffs.push({
        joint,
        angleDifference: avgAngle,
        positionDifference: avgPos,
        severity: worstSeverity,
        description: generateDescription(joint, avgPos, avgAngle, worstSeverity),
      });
    });

    return {
      overallSimilarity: avgSimilarity,
      formScore: Math.round(avgFormScore),
      jointDifferences: averagedJointDiffs,
      criticalIssues: Array.from(allCriticalIssues),
      minorIssues: Array.from(allMinorIssues),
    };
  } catch {
    // Return a default result instead of throwing to prevent UI hang
    return {
      overallSimilarity: 0,
      formScore: 0,
      jointDifferences: [],
      criticalIssues: ["Error during comparison. Please try again."],
      minorIssues: [],
    };
  }
}

