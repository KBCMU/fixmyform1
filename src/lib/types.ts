/**
 * Shared TypeScript types and interfaces for FixMyForm
 */

export interface ExerciseType {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  createdAt: number;
}

export interface VideoUpload {
  id: string;
  userId: string;
  exerciseType: string;
  url: string;
  r2Key: string;
  uploadedAt: number;
  status: "uploading" | "processing" | "complete" | "error";
}

export interface AnalysisSession {
  id: string;
  userId?: string;
  exerciseType: string;
  videoUrl: string;
  status: "idle" | "uploading" | "processing" | "analyzing" | "complete" | "error";
  analysisResult?: AnalysisResult;
  createdAt: number;
  updatedAt: number;
}

export interface AnalysisResult {
  formScore: number;
  keyFindings: string[];
  improvementTips: string[];
  poseComparison?: PoseComparison;
  avatarData?: AvatarPoseData;
}

export interface PoseComparison {
  userPose: PoseKeypoints;
  referencePose: PoseKeypoints;
  differences: PoseDifference[];
}

export interface PoseKeypoints {
  nose?: [number, number, number];
  leftEye?: [number, number, number];
  rightEye?: [number, number, number];
  leftEar?: [number, number, number];
  rightEar?: [number, number, number];
  leftShoulder?: [number, number, number];
  rightShoulder?: [number, number, number];
  leftElbow?: [number, number, number];
  rightElbow?: [number, number, number];
  leftWrist?: [number, number, number];
  rightWrist?: [number, number, number];
  leftHip?: [number, number, number];
  rightHip?: [number, number, number];
  leftKnee?: [number, number, number];
  rightKnee?: [number, number, number];
  leftAnkle?: [number, number, number];
  rightAnkle?: [number, number, number];
}

export interface PoseDifference {
  joint: string;
  angleDifference: number;
  positionDifference: number;
  severity: "minor" | "moderate" | "major";
}

export interface AvatarPoseData {
  keypoints3D: PoseKeypoints;
  skeleton: SkeletonConnection[];
}

export interface SkeletonConnection {
  from: string;
  to: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

