"use client";

import { useEffect, useRef, useState } from "react";
import type { PoseEstimationResult } from "@/lib/pose-estimation-v2";

// Custom drawing functions for pose visualization
const drawConnectors = (
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number; visibility?: number }>,
  connections: Array<[number, number]>,
  options: { color: string; lineWidth: number }
) => {
  ctx.strokeStyle = options.color;
  ctx.lineWidth = options.lineWidth;

  connections.forEach(([start, end]) => {
    const startLandmark = landmarks[start];
    const endLandmark = landmarks[end];

    if (startLandmark && endLandmark &&
      startLandmark.visibility && startLandmark.visibility > 0.1 &&
      endLandmark.visibility && endLandmark.visibility > 0.1) {
      ctx.beginPath();
      ctx.moveTo(startLandmark.x, startLandmark.y);
      ctx.lineTo(endLandmark.x, endLandmark.y);
      ctx.stroke();
    }
  });
};

const drawLandmarks = (
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number; visibility?: number }>,
  options: { color: string; lineWidth: number; radius: number }
) => {
  landmarks.forEach((landmark) => {
    if (landmark.visibility && landmark.visibility > 0.1) {
      ctx.fillStyle = options.color;
      ctx.beginPath();
      ctx.arc(landmark.x, landmark.y, options.radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
};

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

interface PoseVideoPlayerProps {
  videoUrl: string;
  poseResults: PoseEstimationResult[];
  interval?: number; // ms between pose samples (default 100ms)
}

export default function PoseVideoPlayer({
  videoUrl,
  poseResults,
  interval = 100,
}: PoseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const drawPoseRef = useRef<(() => void) | null>(null);

  // Find the closest pose result for a given video timestamp
  const getPoseForTime = useRef((currentTime: number): PoseEstimationResult | null => {
    if (poseResults.length === 0) return null;

    const frameIndex = Math.floor((currentTime * 1000) / interval);
    const clampedIndex = Math.max(0, Math.min(frameIndex, poseResults.length - 1));
    return poseResults[clampedIndex];
  });

  // Update the ref when poseResults or interval changes
  useEffect(() => {
    getPoseForTime.current = (currentTime: number): PoseEstimationResult | null => {
      if (poseResults.length === 0) return null;
      const frameIndex = Math.floor((currentTime * 1000) / interval);
      const clampedIndex = Math.max(0, Math.min(frameIndex, poseResults.length - 1));
      return poseResults[clampedIndex];
    };
  }, [poseResults, interval]);

  // Convert our keypoints format to MediaPipe format for drawing
  const convertToMediaPipeLandmarks = (keypoints: Record<string, { x: number; y: number; z?: number; visibility?: number }>) => {
    const landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }> = [];

    // Initialize all 33 landmarks with zeros
    for (let i = 0; i < 33; i++) {
      landmarks.push({ x: 0, y: 0, z: 0, visibility: 0 });
    }

    // Map our stored keypoints to MediaPipe indices
    const keypointMap: Record<string, number> = {
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

    // Fill in the landmarks we have
    Object.entries(keypointMap).forEach(([key, index]) => {
      const landmark = keypoints[key];
      if (landmark) {
        landmarks[index] = {
          x: landmark.x,
          y: landmark.y,
          z: landmark.z ?? 0,
          visibility: landmark.visibility ?? 1,
        };
      }
    });

    return landmarks;
  };

  // Draw pose on canvas (overlay only, not the video frame)
  useEffect(() => {
    drawPoseRef.current = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match video's actual rendered size
      let displayWidth: number;
      let displayHeight: number;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const rect = video.getBoundingClientRect();
        const videoAspect = video.videoWidth / video.videoHeight;
        const containerAspect = rect.width / rect.height;

        if (containerAspect > videoAspect) {
          displayHeight = rect.height;
          displayWidth = displayHeight * videoAspect;
        } else {
          displayWidth = rect.width;
          displayHeight = displayWidth / videoAspect;
        }
      } else {
        const rect = video.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return;
        }
        displayWidth = rect.width;
        displayHeight = rect.height;
      }

      // Set canvas to match video display size
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      // Clear canvas (transparent background - we're overlaying on video)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get pose for current video time
      const pose = getPoseForTime.current(video.currentTime);
      if (!pose) return;

      // Convert keypoints to MediaPipe format
      const landmarks = convertToMediaPipeLandmarks(pose.keypoints as Record<string, { x: number; y: number; z?: number; visibility?: number }>);

      // Scale landmarks from normalized coordinates (0-1) to canvas coordinates
      const scaledLandmarks = landmarks.map(landmark => ({
        x: landmark.x * canvas.width,
        y: landmark.y * canvas.height,
        z: landmark.z,
        visibility: landmark.visibility,
      }));

      // Check if we have enough valid landmarks to draw
      const validLandmarks = scaledLandmarks.filter(l =>
        l.x > 0 && l.y > 0 && (l.visibility === undefined || l.visibility > 0)
      );

      if (validLandmarks.length < 3) {
        return;
      }

      // Draw pose skeleton
      try {
        // Draw connections first (green lines)
        drawConnectors(ctx, scaledLandmarks, POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 3,
        });

        // Draw landmarks (red dots)
        drawLandmarks(ctx, scaledLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
          radius: 4,
        });
      } catch {
        // Silently handle drawing errors
      }
    };
  }, [poseResults, interval]);

  // Update pose visualization on video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video || poseResults.length === 0) return;

    // Throttle drawing to avoid performance issues
    let animationFrameId: number | null = null;
    let lastDrawTime = 0;
    const drawInterval = 33; // ~30fps (33ms)

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastDrawTime < drawInterval) return;
      lastDrawTime = now;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        if (drawPoseRef.current) {
          drawPoseRef.current();
        }
      });
    };

    const handleLoadedMetadata = () => {
      // Wait a bit for video to be properly sized
      setTimeout(() => {
        if (drawPoseRef.current) {
          drawPoseRef.current();
        }
      }, 100);
    };

    const handleResize = () => {
      if (drawPoseRef.current) {
        drawPoseRef.current();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleTimeUpdate);
    window.addEventListener("resize", handleResize);

    // Initial draw after a short delay to ensure video is sized
    const initTimeout = setTimeout(() => {
      if (video.readyState >= 1 && drawPoseRef.current) {
        drawPoseRef.current();
      }
    }, 200);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(initTimeout);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleTimeUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, [poseResults, interval]);

  if (poseResults.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-600">
        No pose data available
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full h-auto"
        playsInline
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>

      {/* Canvas Overlay - positioned exactly over video */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain"
        }}
      />

      {/* Playback Info Overlay */}
      {isPlaying && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          {poseResults.length} poses detected
        </div>
      )}
    </div>
  );
}
