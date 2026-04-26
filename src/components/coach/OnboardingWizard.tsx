"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TrainingBackground } from "@/lib/agent/types";
import BackgroundStep from "./steps/BackgroundStep";
import GoalsStep from "./steps/GoalsStep";
import InjuriesStep from "./steps/InjuriesStep";
import PreferencesStep from "./steps/PreferencesStep";
import ReviewStep from "./steps/ReviewStep";

const STEP_COUNT = 5;
const STEP_NAMES = ["Background", "Frequency", "Injuries", "Preferences", "Review"];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<Partial<TrainingBackground>>({
    primaryGoals: ["Hypertrophy"],
    injuries: [],
    preferredEquipment: [],
  });

  function goNext() {
    if (step < STEP_COUNT - 1) setStep(step + 1);
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  function goTo(index: number) {
    setStep(index);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/coach/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to save (${res.status})`);
      }

      // Reload the page so the parent coach page re-fetches the profile
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "740px", margin: "0 auto" }}>
      {/* Progress bar */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          {STEP_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => {
                if (i < step) goTo(i);
              }}
              style={{
                background: "none",
                border: "none",
                padding: "4px 8px",
                cursor: i < step ? "pointer" : "default",
                color: i === step ? "#E66A23" : i < step ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                fontSize: "11px",
                fontFamily: "'Geist Mono', monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "color 0.2s ease",
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div
          style={{
            height: "2px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "1px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / STEP_COUNT) * 100}%`,
              background: "#E66A23",
              borderRadius: "1px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: "8px",
            fontSize: "11px",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Geist Mono', monospace",
          }}
        >
          Step {step + 1} of {STEP_COUNT}
        </div>
      </div>

      {/* Step content */}
      {step === 0 && (
        <BackgroundStep
          value={{
            experienceLevel: data.experienceLevel,
            experienceYears: data.experienceYears,
          }}
          onChange={(bg) => setData({ ...data, ...bg })}
          onNext={goNext}
        />
      )}
      {step === 1 && (
        <GoalsStep
          value={{
            trainingFrequency: data.trainingFrequency,
          }}
          onChange={(freq) => setData({ ...data, ...freq })}
          onNext={goNext}
        />
      )}
      {step === 2 && (
        <InjuriesStep
          value={{ injuries: data.injuries }}
          onChange={(inj) => setData({ ...data, ...inj })}
          onNext={goNext}
        />
      )}
      {step === 3 && (
        <PreferencesStep
          value={{
            preferredEquipment: data.preferredEquipment,
            dietApproach: data.dietApproach,
            additionalNotes: data.additionalNotes,
          }}
          onChange={(prefs) => setData({ ...data, ...prefs })}
          onNext={goNext}
        />
      )}
      {step === 4 && (
        <ReviewStep value={data} onEdit={goTo} onSubmit={handleSubmit} submitting={submitting} />
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            color: "#EF4444",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Back button — not shown on first step or review step */}
      {step > 0 && step < STEP_COUNT - 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
          <button
            onClick={goBack}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              cursor: "pointer",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
