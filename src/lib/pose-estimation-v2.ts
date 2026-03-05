/**
 * MediaPipe Pose Estimation Service (Using @mediapipe/tasks-vision)
 * Updated implementation using the latest MediaPipe Tasks API
 */

import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export interface PoseKeypoints {
  // 33 MediaPipe Pose landmarks (simplified for key joints)
  nose?: Landmark;
  leftEye?: Landmark;
  rightEye?: Landmark;
  leftEar?: Landmark;
  rightEar?: Landmark;
  leftShoulder?: Landmark;
  rightShoulder?: Landmark;
  leftElbow?: Landmark;
  rightElbow?: Landmark;
  leftWrist?: Landmark;
  rightWrist?: Landmark;
  leftHip?: Landmark;
  rightHip?: Landmark;
  leftKnee?: Landmark;
  rightKnee?: Landmark;
  leftAnkle?: Landmark;
  rightAnkle?: Landmark;
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
  image?: string; // Optional base64 encoded image of the frame
}

export interface PoseEstimationOptions {
  runningMode?: "IMAGE" | "VIDEO";
  numPoses?: number;
  minPoseDetectionConfidence?: number;
  minPosePresenceConfidence?: number;
  minTrackingConfidence?: number;
}

export class PoseEstimationService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized = false;
  private options: Required<PoseEstimationOptions>;

  constructor(options: PoseEstimationOptions = {}) {
    this.options = {
      runningMode: options.runningMode ?? "VIDEO",
      numPoses: options.numPoses ?? 1,
      minPoseDetectionConfidence: options.minPoseDetectionConfidence ?? 0.5,
      minPosePresenceConfidence: options.minPosePresenceConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
    };
  }

  /**
   * Initialize MediaPipe Pose Landmarker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load the MediaPipe Vision WASM files
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
      );

      // Create PoseLandmarker
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: this.options.runningMode,
        numPoses: this.options.numPoses,
        minPoseDetectionConfidence: this.options.minPoseDetectionConfidence,
        minPosePresenceConfidence: this.options.minPosePresenceConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing MediaPipe:", error);
      throw new Error("Failed to initialize pose estimation");
    }
  }

  /**
   * Estimate pose from a video frame or image element
   */
  async estimatePose(
    imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    timestamp?: number
  ): Promise<PoseEstimationResult | null> {
    if (!this.isInitialized || !this.poseLandmarker) {
      await this.initialize();
    }

    try {
      let result;
      if (this.options.runningMode === "VIDEO") {
        result = this.poseLandmarker!.detectForVideo(
          imageElement,
          timestamp ?? performance.now()
        );
      } else {
        result = this.poseLandmarker!.detect(imageElement);
      }

      if (!result || !result.landmarks || result.landmarks.length === 0) {
        return null;
      }

      // Get first pose (we're focused on single-person analysis)
      const landmarks = result.landmarks[0];
      const keypoints = this.formatLandmarks(landmarks);
      const confidence = this.calculateAverageConfidence(landmarks);

      return {
        keypoints,
        timestamp: Date.now(),
        confidence,
      };
    } catch (error) {
      console.error("Error detecting pose:", error);
      return null;
    }
  }

  /**
   * Process video and extract poses at specified intervals
   */
  async processVideo(
    videoElement: HTMLVideoElement,
    options: {
      interval?: number;
      captureImages?: boolean; // Whether to capture base64 images of frames
      onProgress?: (progress: number) => void;
      onPoseDetected?: (result: PoseEstimationResult) => void;
    } = {}
  ): Promise<PoseEstimationResult[]> {
    const { interval = 100, captureImages = false, onProgress, onPoseDetected } = options;
    const results: PoseEstimationResult[] = [];
    const duration = videoElement.duration * 1000;

    if (!duration || isNaN(duration) || duration === Infinity) {
      throw new Error("Invalid video duration. Video may not be loaded properly.");
    }

    let currentTime = 0;

    // Switch to VIDEO mode if not already
    if (this.options.runningMode !== "VIDEO") {
      this.options.runningMode = "VIDEO";
      this.dispose();
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const processFrame = async () => {
        try {
          if (currentTime >= duration) {
            resolve(results);
            return;
          }

          videoElement.currentTime = currentTime / 1000;

          // Wait for video to seek to the frame
          await new Promise((r) => {
            const timeout = setTimeout(() => {
              r(undefined);
            }, 5000); // 5 second timeout

            videoElement.addEventListener("seeked", () => {
              clearTimeout(timeout);
              r(undefined);
            }, { once: true });
          });

          const result = await this.estimatePose(videoElement, currentTime);
          if (result) {
            if (captureImages) {
              result.image = this.captureFrameAsBase64(videoElement);
            }
            results.push(result);
            onPoseDetected?.(result);
          }

          currentTime += interval;
          const progress = (currentTime / duration) * 100;
          onProgress?.(Math.min(progress, 100));

          setTimeout(processFrame, 0);
        } catch (error) {
          console.error("Error processing frame at", currentTime, "ms:", error);
          reject(error);
        }
      };

      processFrame();
    });
  }

  /**
   * Format MediaPipe landmarks to our PoseKeypoints format
   */
  private formatLandmarks(
    landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>
  ): PoseKeypoints {
    const keypoints: PoseKeypoints = {};

    // Map key landmarks (17 main joints for compatibility)
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
      if (landmark) {
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
   * Calculate average confidence from landmarks
   */
  private calculateAverageConfidence(
    landmarks: Array<{ visibility?: number }>
  ): number {
    if (landmarks.length === 0) return 0;

    const sum = landmarks.reduce(
      (acc, landmark) => acc + (landmark.visibility ?? 0),
      0
    );
    return sum / landmarks.length;
  }

  /**
   * Get drawing utils for visualization
   */
  getDrawingUtils(canvasCtx: CanvasRenderingContext2D): DrawingUtils {
    return new DrawingUtils(canvasCtx);
  }

  /**
   * Capture the current frame of a video element as a base64 encoded JPEG
   */
  private captureFrameAsBase64(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Use JPEG with 0.7 quality to keep payload size manageable for Claude
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isInitialized = false;
  }
}

