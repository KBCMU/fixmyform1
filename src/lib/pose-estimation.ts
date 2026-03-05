/**
 * MediaPipe Pose Estimation Service
 * 
 * Handles pose detection from video frames using MediaPipe Pose
 */

import { Pose } from "@mediapipe/pose";
import { POSE_CONNECTIONS, POSE_LANDMARKS } from "@mediapipe/drawing_utils";

export interface PoseKeypoints {
  // 33 MediaPipe Pose landmarks
  nose?: Landmark;
  leftEyeInner?: Landmark;
  leftEye?: Landmark;
  leftEyeOuter?: Landmark;
  rightEyeInner?: Landmark;
  rightEye?: Landmark;
  rightEyeOuter?: Landmark;
  leftEar?: Landmark;
  rightEar?: Landmark;
  mouthLeft?: Landmark;
  mouthRight?: Landmark;
  leftShoulder?: Landmark;
  rightShoulder?: Landmark;
  leftElbow?: Landmark;
  rightElbow?: Landmark;
  leftWrist?: Landmark;
  rightWrist?: Landmark;
  leftPinky?: Landmark;
  rightPinky?: Landmark;
  leftIndex?: Landmark;
  rightIndex?: Landmark;
  leftThumb?: Landmark;
  rightThumb?: Landmark;
  leftHip?: Landmark;
  rightHip?: Landmark;
  leftKnee?: Landmark;
  rightKnee?: Landmark;
  leftAnkle?: Landmark;
  rightAnkle?: Landmark;
  leftHeel?: Landmark;
  rightHeel?: Landmark;
  leftFootIndex?: Landmark;
  rightFootIndex?: Landmark;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseEstimationResult {
  keypoints: PoseKeypoints;
  timestamp: number;
  confidence: number;
}

export interface PoseEstimationOptions {
  modelComplexity?: 0 | 1 | 2; // 0=Light, 1=Full, 2=Heavy
  smoothLandmarks?: boolean;
  enableSegmentation?: boolean;
  smoothSegmentation?: boolean;
  minDetectionConfidence?: number; // 0-1
  minTrackingConfidence?: number; // 0-1
}

export class PoseEstimationService {
  private pose: Pose | null = null;
  private isInitialized = false;
  private options: Required<PoseEstimationOptions>;

  constructor(options: PoseEstimationOptions = {}) {
    this.options = {
      modelComplexity: options.modelComplexity ?? 1,
      smoothLandmarks: options.smoothLandmarks ?? true,
      enableSegmentation: options.enableSegmentation ?? false,
      smoothSegmentation: options.smoothSegmentation ?? false,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
    };
  }

  /**
   * Initialize MediaPipe Pose
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    this.pose.setOptions({
      modelComplexity: this.options.modelComplexity,
      smoothLandmarks: this.options.smoothLandmarks,
      enableSegmentation: this.options.enableSegmentation,
      smoothSegmentation: this.options.smoothSegmentation,
      minDetectionConfidence: this.options.minDetectionConfidence,
      minTrackingConfidence: this.options.minTrackingConfidence,
    });

    this.isInitialized = true;
  }

  /**
   * Estimate pose from a video frame or image element
   */
  async estimatePose(
    imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<PoseEstimationResult | null> {
    if (!this.isInitialized || !this.pose) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      if (!this.pose) {
        resolve(null);
        return;
      }

      this.pose.onResults((results) => {
        if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
          resolve(null);
          return;
        }

        const keypoints = this.formatLandmarks(results.poseLandmarks);
        const confidence = this.calculateAverageConfidence(results.poseLandmarks);

        resolve({
          keypoints,
          timestamp: Date.now(),
          confidence,
        });
      });

      this.pose.send({ image: imageElement });
    });
  }

  /**
   * Process video and extract poses at specified intervals
   */
  async processVideo(
    videoElement: HTMLVideoElement,
    options: {
      interval?: number; // milliseconds between frames
      onProgress?: (progress: number) => void;
      onPoseDetected?: (result: PoseEstimationResult) => void;
    } = {}
  ): Promise<PoseEstimationResult[]> {
    const { interval = 100, onProgress, onPoseDetected } = options;
    const results: PoseEstimationResult[] = [];
    const duration = videoElement.duration * 1000; // Convert to milliseconds
    let currentTime = 0;

    return new Promise((resolve) => {
      const processFrame = async () => {
        if (currentTime >= duration) {
          resolve(results);
          return;
        }

        videoElement.currentTime = currentTime / 1000; // Convert back to seconds

        await new Promise((r) => {
          videoElement.addEventListener(
            "seeked",
            () => {
              r(undefined);
            },
            { once: true }
          );
        });

        const result = await this.estimatePose(videoElement);
        if (result) {
          results.push(result);
          onPoseDetected?.(result);
        }

        currentTime += interval;
        const progress = (currentTime / duration) * 100;
        onProgress?.(Math.min(progress, 100));

        // Process next frame
        setTimeout(processFrame, 0);
      };

      processFrame();
    });
  }

  /**
   * Format MediaPipe landmarks to our PoseKeypoints format
   */
  private formatLandmarks(landmarks: Array<{x: number; y: number; z?: number; visibility?: number}>): PoseKeypoints {
    const keypoints: PoseKeypoints = {};

    // Map MediaPipe landmarks to our format
    // MediaPipe Pose has 33 landmarks (0-32)
    const landmarkMap: Array<keyof PoseKeypoints> = [
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

    landmarks.forEach((landmark, index) => {
      if (index < landmarkMap.length) {
        const key = landmarkMap[index];
        keypoints[key] = {
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
   * Calculate average confidence from landmarks
   */
  private calculateAverageConfidence(landmarks: Array<{x: number; y: number; z?: number; visibility?: number}>): number {
    if (landmarks.length === 0) return 0;

    const sum = landmarks.reduce(
      (acc, landmark) => acc + (landmark.visibility ?? 0),
      0
    );
    return sum / landmarks.length;
  }

  /**
   * Get pose connections for drawing skeleton
   */
  getPoseConnections() {
    return POSE_CONNECTIONS;
  }

  /**
   * Get pose landmarks constants
   */
  getPoseLandmarks() {
    return POSE_LANDMARKS;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
  }
}

/**
 * Convert pose keypoints to a flat array for embedding generation
 */
export function keypointsToArray(keypoints: PoseKeypoints): number[] {
  const array: number[] = [];
  const keys: Array<keyof PoseKeypoints> = [
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

  keys.forEach((key) => {
    const landmark = keypoints[key];
    if (landmark) {
      array.push(landmark.x, landmark.y, landmark.z ?? 0);
    } else {
      // Fill with zeros if landmark is missing
      array.push(0, 0, 0);
    }
  });

  return array;
}

/**
 * Normalize pose keypoints to a standard scale
 */
export function normalizeKeypoints(keypoints: PoseKeypoints): PoseKeypoints {
  // Find bounding box
  const points = Object.values(keypoints).filter(
    (p): p is Landmark => p !== undefined
  );

  if (points.length === 0) return keypoints;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scale = Math.max(width, height);

  // Normalize to [-1, 1] range centered at origin
  const normalized: PoseKeypoints = {};
  Object.entries(keypoints).forEach(([key, landmark]) => {
    if (landmark) {
      normalized[key as keyof PoseKeypoints] = {
        x: ((landmark.x - minX) / scale) * 2 - 1,
        y: ((landmark.y - minY) / scale) * 2 - 1,
        z: landmark.z ?? 0,
        visibility: landmark.visibility,
      };
    }
  });

  return normalized;
}

