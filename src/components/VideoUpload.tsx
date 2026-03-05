"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { PoseEstimationService, type PoseEstimationResult } from "@/lib/pose-estimation-v2";

interface VideoUploadProps {
  onPoseDetected?: (results: PoseEstimationResult[], videoUrl?: string) => void;
  onError?: (error: Error) => void;
  exerciseType?: string;
  onVideoLoaded?: (videoElement: HTMLVideoElement, videoUrl: string) => void;
}

export default function VideoUpload({
  onPoseDetected,
  onError,
  onVideoLoaded,
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [poseService] = useState(() => new PoseEstimationService());
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const video = videoRef.current;
      if (video.src !== videoUrl) {
        video.src = videoUrl;
      }
    }
  }, [videoUrl]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        onError?.(new Error("Please select a video file"));
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

            video.addEventListener('loadedmetadata', () => {
              clearTimeout(timeout);
              if (onVideoLoaded && videoRef.current) {
                onVideoLoaded(videoRef.current, url);
              }
              resolve();
            }, { once: true });

            video.addEventListener('error', () => {
              clearTimeout(timeout);
              reject(new Error("Failed to load video file. MOV files may need conversion to MP4."));
            }, { once: true });

            video.load();
          });
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error("Failed to load video"));
        setVideoUrl(null);
      } finally {
        setIsLoadingVideo(false);
      }
    },
    [onError, onVideoLoaded]
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

  const getVideoErrorMessage = (code: number): string => {
    switch (code) {
      case 1: return "Video loading aborted";
      case 2: return "Network error while loading video";
      case 3: return "Video decoding error - file may be corrupted";
      case 4: return "Video format not supported";
      default: return "Unknown video error";
    }
  };

  const processVideo = useCallback(async () => {
    if (!videoRef.current || !videoUrl) {
      onError?.(new Error("Video not available. Please upload a video first."));
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
            const errorMsg = video.error
              ? `Video error code ${video.error.code}: ${getVideoErrorMessage(video.error.code)}`
              : "Video failed to load";
            reject(new Error(errorMsg));
          };

          video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
          video.addEventListener('error', handleError, { once: true });
          video.load();
        });
      } catch (error) {
        onError?.(new Error(error instanceof Error ? error.message : "Video failed to load."));
        return;
      }
    }

    if (!video.duration || isNaN(video.duration) || video.duration === Infinity || video.duration <= 0) {
      onError?.(new Error(`Video duration is invalid (${video.duration}). Try converting to MP4.`));
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      await poseService.initialize();

      const results = await poseService.processVideo(video, {
        interval: 100,
        captureImages: true,
        onProgress: (prog) => {
          setProgress(prog);
        },
      });

      if (results.length > 0) {
        onPoseDetected?.(results, videoUrl || undefined);
      } else {
        onError?.(new Error("No poses detected in video. Make sure a person is visible in the frame."));
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Processing failed: " + String(error)));
    } finally {
      setIsProcessing(false);
    }
  }, [videoUrl, poseService, onPoseDetected, onError]);

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
    <div className="w-full max-w-4xl mx-auto">
      {/* Upload Area */}
      {!videoUrl && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="p-12 text-center cursor-pointer transition-all duration-200"
          style={{
            background: isDragOver ? "var(--bg-elevated)" : "var(--bg-card)",
            border: `2px dashed ${isDragOver ? "var(--accent-teal)" : "var(--border-subtle)"}`,
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke={isDragOver ? "var(--accent-teal)" : "var(--text-muted)"}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Upload exercise video
          </h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            Drag and drop or click to browse
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            MP4, WebM, MOV (MP4 recommended)
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingVideo && (
        <div className="flex items-center justify-center p-12" style={{ background: "var(--bg-card)" }}>
          <div className="text-center">
            <div
              className="inline-block w-12 h-12 mb-4"
              style={{
                border: "3px solid var(--border-subtle)",
                borderTopColor: "var(--accent-lime)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Loading video...</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              This may take a moment for large files
            </p>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {videoUrl && !isProcessing && !isLoadingVideo && (
        <div className="space-y-4">
          <div className="relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
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
          </div>
          <div className="flex gap-3">
            <button
              onClick={processVideo}
              className="flex-1 py-3 font-bold text-sm transition-all duration-200"
              style={{
                background: "var(--accent-lime)",
                color: "var(--bg-primary)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-lime-dark)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-lime)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Analyze Form
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-teal)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="space-y-4">
          <div className="relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
            <video
              ref={videoRef}
              src={videoUrl || undefined}
              className="w-full h-auto opacity-40"
              playsInline
              muted
              loop
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="inline-block w-12 h-12 mb-4"
                  style={{
                    border: "3px solid rgba(255,255,255,0.2)",
                    borderTopColor: "var(--accent-lime)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  Processing... {Math.round(progress)}%
                </p>
              </div>
            </div>
          </div>
          <div className="w-full h-1" style={{ background: "var(--border-subtle)" }}>
            <div
              className="h-1 transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "var(--accent-lime)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
