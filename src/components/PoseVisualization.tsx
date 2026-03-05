"use client";

import { useEffect, useRef } from "react";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import type { PoseEstimationResult } from "@/lib/pose-estimation-v2";

// POSE_CONNECTIONS defines which landmarks to connect with lines
// MediaPipe Pose has 33 landmarks, these are the connections between them
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], // Face
  [0, 4], [4, 5], [5, 6], [6, 8], // Face
  [9, 10], // Mouth
  [11, 12], // Shoulders
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  [11, 23], [12, 24], // Torso
  [23, 24], // Hips
  [23, 25], [25, 27], // Left leg
  [24, 26], [26, 28], // Right leg
  [27, 29], [29, 31], // Left foot
  [28, 30], [30, 32], // Right foot
] as Array<[number, number]>;

interface PoseVisualizationProps {
  videoElement: HTMLVideoElement | null;
  poseResults: PoseEstimationResult[];
  currentFrame?: number;
}

export default function PoseVisualization({
  videoElement,
  poseResults,
  currentFrame = 0,
}: PoseVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoElement || !canvasRef.current || poseResults.length === 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Get current pose result
    const result = poseResults[currentFrame];
    if (!result) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert our keypoints format to MediaPipe format for drawing
    const landmarks = convertToMediaPipeLandmarks(result.keypoints as Record<string, { x: number; y: number; z?: number; visibility?: number }>);

    // Draw pose
    drawConnectors(ctx, landmarks, POSE_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 2,
    });
    drawLandmarks(ctx, landmarks, {
      color: "#FF0000",
      lineWidth: 1,
      radius: 3,
    });
  }, [videoElement, poseResults, currentFrame]);

  // Convert our keypoints to MediaPipe format
  const convertToMediaPipeLandmarks = (keypoints: Record<string, { x: number; y: number; z?: number; visibility?: number }>) => {
    const landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }> = [];
    const keys = [
      "nose",
      "leftEyeInner",
      "leftEye",
      "leftEyeOuter",
      "rightEyeInner",
      "rightEye",
      "rightEyeOuter",
      "leftEar",
      "rightEar",
      "mouthLeft",
      "mouthRight",
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftPinky",
      "rightPinky",
      "leftIndex",
      "rightIndex",
      "leftThumb",
      "rightThumb",
      "leftHip",
      "rightHip",
      "leftKnee",
      "rightKnee",
      "leftAnkle",
      "rightAnkle",
      "leftHeel",
      "rightHeel",
      "leftFootIndex",
      "rightFootIndex",
    ];

    keys.forEach((key) => {
      const landmark = keypoints[key];
      if (landmark) {
        landmarks.push({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z ?? 0,
          visibility: landmark.visibility ?? 1,
        });
      } else {
        landmarks.push({ x: 0, y: 0, z: 0, visibility: 0 });
      }
    });

    return landmarks;
  };

  if (!videoElement || poseResults.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg"
        style={{ maxWidth: "100%" }}
      />
    </div>
  );
}

