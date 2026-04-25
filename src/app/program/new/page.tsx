"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

import ExperienceStep from "@/components/program/ExperienceStep";
import ScheduleStep from "@/components/program/ScheduleStep";
import LocationStep from "@/components/program/LocationStep";
import WeakPointsStep from "@/components/program/WeakPointsStep";
import SplitStep from "@/components/program/SplitStep";
import AuthGate from "@/components/program/AuthGate";
import GenerateStep from "@/components/program/GenerateStep";

import type { UserProfile, GeneratedProgram, ExperienceLevel, GymType, SplitType, MuscleBias } from "@/components/program/types";

// All possible step IDs (some are conditional)
type StepId = "experience" | "schedule" | "location" | "weak-points" | "split" | "auth" | "generate";

interface StepDef {
  id: StepId;
  label: string;
}

const ALL_STEPS: StepDef[] = [
  { id: "experience", label: "Experience" },
  { id: "schedule", label: "Schedule" },
  { id: "location", label: "Location" },
  { id: "weak-points", label: "Weak Points" }, // conditional: advanced only
  { id: "split", label: "Split" },
  { id: "auth", label: "Sign Up" },             // conditional: unauthenticated only
  { id: "generate", label: "Generate" },
];

export default function ProgramNewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    weakPoints: [],
  });
  const [currentStepId, setCurrentStepId] = useState<StepId>("experience");
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgram | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Compute which steps are actually active given current profile state
  function computeActiveSteps(p: Partial<UserProfile>, isAuthed: boolean): StepDef[] {
    return ALL_STEPS.filter((s) => {
      if (s.id === "weak-points") return p.experience === "advanced";
      if (s.id === "auth") return !isAuthed;
      return true;
    });
  }

  const isAuthed = !!user;
  const activeSteps = computeActiveSteps(profile, isAuthed);
  const currentStepIndex = activeSteps.findIndex((s) => s.id === currentStepId);

  // Re-route if current step is no longer in active steps (e.g., user logged in mid-flow)
  useEffect(() => {
    if (!authLoading && !activeSteps.find((s) => s.id === currentStepId)) {
      // Current step was removed (e.g., auth step removed because user logged in)
      // Move forward to next logical step
      const fallbackIdx = Math.min(currentStepIndex, activeSteps.length - 1);
      if (fallbackIdx >= 0) {
        setCurrentStepId(activeSteps[fallbackIdx].id);
      }
    }
  }, [isAuthed, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateProfile(updates: Partial<UserProfile>) {
    setProfile((prev) => ({ ...prev, ...updates }));
  }

  function navigate(direction: "next" | "back") {
    const newIdx = direction === "next" ? currentStepIndex + 1 : currentStepIndex - 1;
    if (newIdx < 0 || newIdx >= activeSteps.length) return;

    // Recompute active steps from latest profile to get accurate nav
    const latest = direction === "next" ? computeActiveSteps(profile, isAuthed) : activeSteps;
    const target = latest[newIdx];
    if (!target) return;

    setTransitioning(true);
    setTimeout(() => {
      setCurrentStepId(target.id);
      setTransitioning(false);
    }, 180);
  }

  function goNext() {
    navigate("next");
  }

  function goBack() {
    navigate("back");
  }

  function handleGenerated(program: GeneratedProgram) {
    setGeneratedProgram(program);
    // Persist program to sessionStorage so the [id] page can read it
    try {
      sessionStorage.setItem("fixmyform_generated_program", JSON.stringify(program));
    } catch {
      // sessionStorage may be unavailable in some environments; navigation still proceeds
    }
    router.push(`/program/${program.id}`);
  }

  // Progress bar %
  const progressPct =
    activeSteps.length > 1
      ? (currentStepIndex / (activeSteps.length - 1)) * 100
      : 0;

  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Header />
      <main>
        {/* Page header */}
        <section className="pt-24 pb-8 px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <h1
              className={`mb-3 transition-all duration-1000 ease-out ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
                fontSize: "clamp(36px, 6vw, 68px)",
                lineHeight: 1,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              PROGRAM <span className="italic opacity-75">BUILDER</span>
            </h1>
            <p
              className={`text-sm max-w-xl mx-auto transition-all duration-1000 delay-300 ease-out ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Answer a few questions and we&apos;ll design your personalised hypertrophy program.
            </p>
          </div>
        </section>

        {/* Step indicator */}
        <section
          className={`py-6 px-6 lg:px-8 transition-all duration-1000 delay-500 ease-out ${loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between relative">
              {/* Background track */}
              <div
                className="absolute top-5 left-0 right-0 h-px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              {/* Progress fill */}
              <div
                className="absolute top-5 left-0 h-px transition-all duration-500"
                style={{
                  background: "#E66A23",
                  width: `${progressPct}%`,
                }}
              />

              {activeSteps.map((step, idx) => {
                const isCurrent = idx === currentStepIndex;
                const isPast = idx < currentStepIndex;
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className="w-10 h-10 flex items-center justify-center font-bold text-sm transition-all duration-300"
                      style={{
                        background: isCurrent ? "#E66A23" : isPast ? "#ffffff" : "#050505",
                        color: isCurrent || isPast ? "#000000" : "rgba(255,255,255,0.35)",
                        border: !isCurrent && !isPast ? "1px solid rgba(255,255,255,0.15)" : "none",
                        borderRadius: "2px",
                      }}
                    >
                      {isPast ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] font-medium mt-3 hidden sm:block"
                      style={{
                        color: isCurrent ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Step content */}
        <section
          className={`py-16 px-6 lg:px-8 transition-all duration-700 delay-700 ease-out ${loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="max-w-5xl mx-auto">
            <div
              style={{
                transition: "opacity 0.18s ease, transform 0.18s ease",
                opacity: transitioning ? 0 : 1,
                transform: transitioning ? "translateY(8px)" : "translateY(0)",
              }}
            >
              {currentStepId === "experience" && (
                <ExperienceStep
                  value={profile.experience}
                  onChange={(level: ExperienceLevel) => updateProfile({ experience: level })}
                  onNext={() => {
                    // Recompute with latest experience so weak-points conditional is correct
                    const updated = { ...profile };
                    const newActive = computeActiveSteps(updated, isAuthed);
                    const idx = newActive.findIndex((s) => s.id === "experience");
                    const next = newActive[idx + 1];
                    if (next) {
                      setTransitioning(true);
                      setTimeout(() => {
                        setCurrentStepId(next.id);
                        setTransitioning(false);
                      }, 180);
                    }
                  }}
                />
              )}

              {currentStepId === "schedule" && (
                <ScheduleStep
                  daysPerWeek={profile.daysPerWeek}
                  minutesPerSession={profile.minutesPerSession}
                  onChange={(field, value) => updateProfile({ [field]: value })}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {currentStepId === "location" && (
                <LocationStep
                  value={profile.gymType}
                  onChange={(type: GymType) => updateProfile({ gymType: type })}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {currentStepId === "weak-points" && (
                <WeakPointsStep
                  weakPoints={profile.weakPoints ?? []}
                  onChange={(points: MuscleBias[]) => updateProfile({ weakPoints: points })}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {currentStepId === "split" && (
                <SplitStep
                  daysPerWeek={profile.daysPerWeek ?? 3}
                  selectedSplit={profile.selectedSplit}
                  onChange={(split: SplitType) => updateProfile({ selectedSplit: split })}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {currentStepId === "auth" && (
                <div>
                  <AuthGate />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "32px",
                    }}
                  >
                    <button
                      onClick={goBack}
                      style={{
                        background: "transparent",
                        color: "rgba(255,255,255,0.5)",
                        border: "none",
                        fontSize: "13px",
                        cursor: "pointer",
                        textDecoration: "underline",
                        textDecorationColor: "rgba(255,255,255,0.2)",
                      }}
                    >
                      ← Go back
                    </button>
                  </div>
                </div>
              )}

              {currentStepId === "generate" && profile.experience && profile.daysPerWeek && profile.minutesPerSession && profile.gymType && profile.selectedSplit && (
                <GenerateStep
                  profile={profile as UserProfile}
                  onGenerated={handleGenerated}
                  onBack={goBack}
                />
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
