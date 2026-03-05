"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoUpload from "@/components/VideoUpload";
import ExerciseSelector from "@/components/ExerciseSelector";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import PoseVideoPlayer from "@/components/PoseVideoPlayer";
import type { PoseEstimationResult } from "@/lib/pose-estimation-v2";
import type { Exercise } from "@/lib/supabase";
import type { FormEvaluationResult } from "@/lib/formEvaluation/types";
import type { FormFeedback } from "@/lib/llm-analysis-claude";
import { saveFormEvaluation } from "@/lib/formEvaluation/formEvaluationService";
import { generateFeedbackWithClaude } from "@/lib/llm-analysis-claude";
import { extractKeyFrames } from "@/lib/formEvaluation/keyFrameExtractor";
import { convertToPoseFrames } from "@/lib/formEvaluation/utils";
import { LegExtensionEvaluator } from "@/lib/formEvaluation/legExtensionEvaluator";
import { MachinePecDeckEvaluator } from "@/lib/formEvaluation/machinePecDeckEvaluator";
import { analyzeExerciseForm } from "@/lib/pose-analysis";

type WorkflowStep = "select-exercise" | "upload-video" | "analyzing" | "results";

const STEPS = [
  { step: 1, label: "Select", id: "select-exercise" as const },
  { step: 2, label: "Upload", id: "upload-video" as const },
  { step: 3, label: "Analyze", id: "analyzing" as const },
  { step: 4, label: "Results", id: "results" as const },
];

export default function FormPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("select-exercise");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [poseResults, setPoseResults] = useState<PoseEstimationResult[]>([]);
  const [evaluation, setEvaluation] = useState<FormEvaluationResult | any>(null);
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleExerciseSelected = (exercise: Exercise | null) => {
    setSelectedExercise(exercise);
    if (exercise) {
      setCurrentStep("upload-video");
    }
  };

  const handlePoseDetected = async (results: PoseEstimationResult[], videoUrlFromUpload?: string) => {
    setPoseResults(results);
    setCurrentStep("analyzing");
    setIsAnalyzing(true);

    if (videoUrlFromUpload && !videoUrl) {
      setVideoUrl(videoUrlFromUpload);
    }

    try {
      const poseFrames = convertToPoseFrames(results);
      let evalResult;

      if (selectedExercise?.exercise_id === 'leg-extension') {
        const evaluator = new LegExtensionEvaluator();
        evalResult = evaluator.evaluate(poseFrames);
      } else if (selectedExercise?.exercise_id === 'machine-pec-deck') {
        const evaluator = new MachinePecDeckEvaluator();
        evalResult = evaluator.evaluate(poseFrames);
      } else {
        const userPoses = results.map((r) => r.keypoints);
        try {
          evalResult = analyzeExerciseForm(selectedExercise!.exercise_id, userPoses);
        } catch {
          evalResult = {
            exercise: selectedExercise?.exercise_id || "unknown",
            totalReps: 0,
            validReps: 0,
            issues: [],
            positives: ["Attempted exercise"],
            overallScore: 70
          };
        }
      }

      setEvaluation(evalResult);

      const keyFrames = extractKeyFrames(poseFrames, 5);
      const keyFrameImages: string[] = [];
      keyFrames.forEach(kf => {
        const originalResult = results.find(r => r.timestamp === kf.timestamp);
        if (originalResult?.image) {
          keyFrameImages.push(originalResult.image);
        }
      });

      const feedbackResult = await generateFeedbackWithClaude(
        selectedExercise!,
        evalResult,
        keyFrameImages.length > 0 ? keyFrameImages : undefined
      );
      setFeedback(feedbackResult);

      try {
        await saveFormEvaluation(evalResult, undefined, videoUrlFromUpload);
      } catch {
        // Non-critical
      }

      setCurrentStep("results");
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing video. Please try again.");
      setCurrentStep("upload-video");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleError = (error: Error) => {
    alert(`Error: ${error.message}`);
  };

  const handleReset = () => {
    setCurrentStep("select-exercise");
    setSelectedExercise(null);
    setPoseResults([]);
    setEvaluation(null);
    setFeedback(null);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Header />
      <main>
        {/* Page Header */}
        <section className="pt-24 pb-8 px-6 lg:px-8" style={{ background: "transparent" }}>
          <div className="max-w-5xl mx-auto text-center">
            <h1
              className={`mb-3 transition-all duration-1000 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: "1",
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              FORM <span className="italic opacity-80">ANALYSIS</span>
            </h1>
            <p
              className={`text-base max-w-xl mx-auto transition-all duration-1000 delay-300 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              Select an exercise, upload your video, and get AI-powered biomechanical feedback.
            </p>
          </div>
        </section>

        {/* Step Indicator */}
        <section className={`py-6 px-6 lg:px-8 transition-all duration-1000 delay-500 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div
                className="absolute top-5 left-0 right-0 h-px"
                style={{ background: "rgba(255, 255, 255, 0.1)" }}
              />
              <div
                className="absolute top-5 left-0 h-px transition-all duration-500"
                style={{
                  background: "rgba(255, 255, 255, 1)",
                  width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                }}
              />

              {STEPS.map((item, idx) => (
                <div key={item.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className="w-10 h-10 flex items-center justify-center font-bold text-sm transition-all duration-300"
                    style={{
                      background:
                        idx < currentStepIndex
                          ? "rgba(255, 255, 255, 1)"
                          : idx === currentStepIndex
                            ? "#ffffff"
                            : "#050505",
                      color:
                        idx <= currentStepIndex
                          ? "#000000"
                          : "rgba(255, 255, 255, 0.4)",
                      border:
                        idx > currentStepIndex
                          ? "1px solid rgba(255, 255, 255, 0.2)"
                          : "none",
                      borderRadius: "2px",
                    }}
                  >
                    {idx < currentStepIndex ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      item.step
                    )}
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-[0.2em] font-medium mt-3"
                    style={{
                      color:
                        idx === currentStepIndex
                          ? "rgba(255, 255, 255, 0.9)"
                          : "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className={`py-16 px-6 lg:px-8 transition-all duration-1000 delay-700 ease-out relative z-20 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ background: "transparent" }}>
          <div className="max-w-5xl mx-auto">
            {/* Step 1: Select Exercise */}
            {currentStep === "select-exercise" && (
              <div>
                <div className="mb-10 text-center">
                  <h2
                    className="text-2xl mb-2"
                    style={{
                      fontFamily: "var(--font-serif), serif",
                      color: "rgba(255, 255, 255, 0.9)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Select Exercise
                  </h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}>
                    Choose the exercise you want to analyze
                  </p>
                </div>
                <ExerciseSelector
                  onSelectExercise={handleExerciseSelected}
                  selectedExercise={selectedExercise}
                />
              </div>
            )}

            {/* Step 2: Upload Video */}
            {currentStep === "upload-video" && selectedExercise && (
              <div className="transition-opacity duration-500 opacity-100">
                <div className="mb-6">
                  <ExerciseSelector
                    onSelectExercise={handleExerciseSelected}
                    selectedExercise={selectedExercise}
                  />
                </div>
                <div className="mb-10 text-center">
                  <h2
                    className="text-2xl mb-2"
                    style={{
                      fontFamily: "var(--font-serif), serif",
                      color: "rgba(255, 255, 255, 0.9)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Upload Video
                  </h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}>
                    Record yourself performing the {selectedExercise.name}
                  </p>
                </div>
                <VideoUpload
                  onPoseDetected={handlePoseDetected}
                  onError={handleError}
                  exerciseType={selectedExercise.id}
                  onVideoLoaded={(_video, url) => {
                    setVideoUrl(url);
                  }}
                />
              </div>
            )}

            {/* Step 3: Analyzing */}
            {currentStep === "analyzing" && (
              <div className="text-center py-16 transition-opacity duration-500 opacity-100">
                <div
                  className="inline-block w-16 h-16 mb-8"
                  style={{
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                    borderTopColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <h2
                  className="text-2xl mb-4"
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    color: "rgba(255, 255, 255, 0.9)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Analyzing Form
                </h2>
                <p className="text-sm mb-10" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                  Evaluating biomechanics for {selectedExercise?.name}
                </p>

                <div className="max-w-sm mx-auto space-y-4 text-left">
                  {[
                    { label: "Pose detection complete", done: true },
                    { label: "Calculating joint angles and kinematics", done: false, active: true },
                    { label: "Generating coaching feedback", done: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 flex items-center justify-center shrink-0 transition-colors duration-500"
                        style={{
                          background: item.done ? "rgba(255, 255, 255, 0.9)" : "transparent",
                          border: item.done
                            ? "none"
                            : item.active
                              ? "1px solid rgba(230, 106, 35, 1)"
                              : "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "50%",
                          ...(item.active && !item.done
                            ? { animation: "spin 1s linear infinite", borderTopColor: "transparent" as any, borderRadius: "50%" }
                            : {}),
                        }}
                      >
                        {item.done && (
                          <svg className="w-4 h-4" fill="none" stroke="white" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          color: item.done
                            ? "var(--text-primary)"
                            : item.active
                              ? "var(--text-secondary)"
                              : "var(--text-muted)",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Results */}
            {currentStep === "results" && evaluation && feedback && (
              <div className="animate-fade-in-up">
                <div className="mb-10 text-center">
                  <h2
                    className="text-3xl font-bold mb-3"
                    style={{
                      fontFamily: "var(--font-bebas-neue), sans-serif",
                      color: "var(--text-primary)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    YOUR {selectedExercise?.name?.toUpperCase()} ANALYSIS
                  </h2>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Based on {poseResults.length} frames evaluated
                  </p>
                </div>

                {/* Pose Visualization */}
                {poseResults.length > 0 && videoUrl && (
                  <div className="mb-10">
                    <div
                      className="p-6"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <h3
                        className="text-xl font-bold mb-3"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Pose Detection Visualization
                      </h3>
                      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--accent-emerald)" }}>Green skeleton</span> = detected pose.{" "}
                        <span style={{ color: "var(--danger)" }}>Red dots</span> = body landmarks.
                      </p>

                      <PoseVideoPlayer
                        videoUrl={videoUrl}
                        poseResults={poseResults}
                        interval={100}
                      />

                      <div className="mt-6 grid grid-cols-3 gap-px" style={{ background: "var(--border-subtle)" }}>
                        {[
                          { value: poseResults.length, label: "Frames" },
                          {
                            value: `${(poseResults.reduce((sum, r) => sum + r.confidence, 0) / poseResults.length * 100).toFixed(1)}%`,
                            label: "Confidence",
                          },
                          {
                            value: Object.keys(poseResults[0]?.keypoints || {}).length,
                            label: "Landmarks",
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="p-4 text-center"
                            style={{ background: "var(--bg-elevated)" }}
                          >
                            <div
                              className="text-2xl font-bold"
                              style={{
                                fontFamily: "var(--font-bebas-neue), sans-serif",
                                color: "var(--accent-lime)",
                              }}
                            >
                              {stat.value}
                            </div>
                            <div
                              className="text-xs uppercase tracking-wider"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <FeedbackDisplay
                  feedback={feedback}
                  evaluation={evaluation}
                  exercise={selectedExercise!}
                  onReset={handleReset}
                />
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
