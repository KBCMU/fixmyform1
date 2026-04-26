"use client";

import { useRef, useState, useCallback } from "react";
import { PoseEstimationService } from "@/lib/pose-estimation-v2";
import { LegExtensionEvaluator, MachinePecDeckEvaluator, convertToPoseFrames } from "@/lib/formEvaluation";
import type { FormEvaluationResult } from "@/lib/formEvaluation/types";

interface VideoAttachmentProps {
  onEvaluationComplete: (evaluation: FormEvaluationResult) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

type ExerciseType = "leg_extension" | "machine_pec_deck";

export default function VideoAttachment({
  onEvaluationComplete,
  onError,
  onCancel,
}: VideoAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [poseService] = useState(() => new PoseEstimationService());
  const [exerciseType, setExerciseType] = useState<ExerciseType>("leg_extension");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        onError(new Error("Please select a video file"));
        return;
      }

      setIsLoadingVideo(true);

      try {
        const url = URL.createObjectURL(file);
        setVideoUrl(url);

        if (videoRef.current) {
          const video = videoRef.current;
          video.src = url;

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Video took too long to load. Try a smaller file or convert to MP4."));
            }, 15000);

            video.addEventListener(
              "loadedmetadata",
              () => {
                clearTimeout(timeout);
                resolve();
              },
              { once: true }
            );

            video.addEventListener(
              "error",
              () => {
                clearTimeout(timeout);
                reject(new Error("Failed to load video file. MOV files may need conversion to MP4."));
              },
              { once: true }
            );

            video.load();
          });
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Failed to load video"));
        setVideoUrl(null);
      } finally {
        setIsLoadingVideo(false);
      }
    },
    [onError]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const processVideo = useCallback(async () => {
    if (!videoRef.current || !videoUrl) {
      onError(new Error("Video not available. Please upload a video first."));
      return;
    }

    const video = videoRef.current;

    if (video.src !== videoUrl) {
      video.src = videoUrl;
      video.load();
    }

    if (video.readyState < 1 || !video.duration || isNaN(video.duration)) {
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video metadata loading timeout after 15 seconds."));
          }, 15000);

          const handleLoadedMetadata = () => {
            clearTimeout(timeout);
            resolve();
          };

          const handleError = () => {
            clearTimeout(timeout);
            reject(new Error("Video failed to load"));
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
          video.addEventListener("error", handleError, { once: true });
          video.load();
        });
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Video failed to load"));
        return;
      }
    }

    if (!video.duration || isNaN(video.duration) || video.duration === Infinity || video.duration <= 0) {
      onError(new Error(`Video duration is invalid. Try converting to MP4.`));
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      await poseService.initialize();

      const results = await poseService.processVideo(video, {
        interval: 100,
        captureImages: false,
        onProgress: (prog) => {
          setProgress(prog);
        },
      });

      if (results.length > 0) {
        // Convert pose results to PoseFrames
        const frames = convertToPoseFrames(results);

        // Run the appropriate evaluator
        let evaluation: FormEvaluationResult;
        if (exerciseType === "leg_extension") {
          const evaluator = new LegExtensionEvaluator();
          evaluation = evaluator.evaluate(frames);
        } else {
          const evaluator = new MachinePecDeckEvaluator();
          evaluation = evaluator.evaluate(frames);
        }

        onEvaluationComplete(evaluation);
      } else {
        onError(new Error("No poses detected in video. Make sure a person is visible in the frame."));
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error("Processing failed: " + String(error)));
    } finally {
      setIsProcessing(false);
    }
  }, [videoUrl, poseService, onEvaluationComplete, onError, exerciseType]);

  const reset = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setProgress(0);
    setIsProcessing(false);
    setIsLoadingVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [videoUrl]);

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "16px",
        background: "rgba(0,0,0,0.5)",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
          Attach Exercise Video
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ×
        </button>
      </div>

      {/* Exercise selector */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>
          Exercise Type
        </label>
        <select
          value={exerciseType}
          onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
          disabled={isProcessing}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            color: "rgba(255,255,255,0.9)",
            fontSize: "14px",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          <option value="leg_extension">Leg Extension</option>
          <option value="machine_pec_deck">Machine Pec Deck</option>
        </select>
      </div>

      {/* Upload Area */}
      {!videoUrl && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            padding: "32px 16px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            background: isDragOver ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
            border: `2px dashed ${isDragOver ? "rgba(230,106,35,0.5)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "4px",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <svg width="32" height="32" fill="none" stroke={isDragOver ? "#E66A23" : "rgba(255,255,255,0.3)"} viewBox="0 0 24 24" style={{ margin: "0 auto 12px", display: "block" }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: "0 0 6px 0" }}>
            Drop video here or click to browse
          </p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
            MP4, WebM (recommended: MP4)
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingVideo && (
        <div style={{ textAlign: "center", padding: "24px", color: "rgba(255,255,255,0.6)" }}>
          <div
            style={{
              display: "inline-block",
              width: "24px",
              height: "24px",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTopColor: "#E66A23",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: "12px",
            }}
          />
          <p style={{ fontSize: "14px", margin: 0 }}>Loading video...</p>
        </div>
      )}

      {/* Video Preview */}
      {videoUrl && !isProcessing && !isLoadingVideo && (
        <div>
          <div style={{ marginBottom: "12px", borderRadius: "4px", overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              style={{ width: "100%", height: "auto", display: "block" }}
              playsInline
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={processVideo}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: "10px",
                background: "#E66A23",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: isProcessing ? "not-allowed" : "pointer",
                opacity: isProcessing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) e.currentTarget.style.background = "#A4430F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E66A23";
              }}
            >
              Analyze Form
            </button>
            <button
              onClick={reset}
              disabled={isProcessing}
              style={{
                padding: "10px 16px",
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: isProcessing ? "not-allowed" : "pointer",
                opacity: isProcessing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div style={{ textAlign: "center", padding: "24px", position: "relative" }}>
          <div
            style={{
              display: "inline-block",
              width: "32px",
              height: "32px",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTopColor: "#E66A23",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: "12px",
            }}
          />
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: "0 0 8px 0" }}>
            Processing... {Math.round(progress)}%
          </p>
          <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "#E66A23",
                width: `${progress}%`,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
