"use client";

import { useState } from "react";
import type { UserProfile, GeneratedProgram } from "./types";

interface GenerateStepProps {
  profile: UserProfile;
  onGenerated: (program: GeneratedProgram) => void;
  onBack: () => void;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  never: "No prior training",
  beginner: "0–1 years",
  intermediate: "1–3 years",
  advanced: "3+ years",
};

const GYM_LABELS: Record<string, string> = {
  commercial: "Commercial Gym",
  home: "Home Gym",
  hotel: "Hotel / Travel",
};

const SPLIT_LABELS: Record<string, string> = {
  full_body: "Full Body",
  upper_lower: "Upper / Lower",
  anterior_posterior: "Anterior / Posterior",
  push_pull_legs: "Push / Pull / Legs",
  upper_lower_ppl: "UL + PPL Hybrid",
};

const BIAS_LABELS: Record<string, string> = {
  chest_upper: "Upper Chest",
  chest_lower: "Lower Chest",
  chest_overall: "Overall Chest",
  lats_upper: "Upper Lats",
  lats_lower: "Lower Lats",
  delts_front: "Front Delts",
  delts_lateral: "Lateral Delts",
  delts_rear: "Rear Delts",
  triceps_long: "Triceps — Long Head",
  triceps_medial_lateral: "Triceps — Medial/Lateral",
  biceps_brachialis: "Biceps — Brachialis",
  biceps_long_short: "Biceps — Long/Short",
};

type GenerationStatus = "idle" | "loading" | "error";

export default function GenerateStep({ profile, onGenerated, onBack }: GenerateStepProps) {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/program/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: null })) as { error?: string };
        throw new Error(data?.error ?? `Server error: ${res.status}`);
      }

      const program: GeneratedProgram = await res.json();
      onGenerated(program);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const summaryItems = [
    { label: "Experience", value: EXPERIENCE_LABELS[profile.experience] ?? profile.experience },
    {
      label: "Schedule",
      value: `${profile.daysPerWeek} days / week — ${profile.minutesPerSession} min sessions`,
    },
    { label: "Location", value: GYM_LABELS[profile.gymType] ?? profile.gymType },
    { label: "Split", value: SPLIT_LABELS[profile.selectedSplit] ?? profile.selectedSplit },
    ...(profile.weakPoints && profile.weakPoints.length > 0
      ? [
          {
            label: "Weak Points",
            value: profile.weakPoints.map((b) => BIAS_LABELS[b] ?? b).join(", "),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-10 text-center">
        <h2
          style={{
            fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            color: "rgba(255,255,255,0.95)",
            letterSpacing: "0.01em",
            marginBottom: "8px",
          }}
        >
          {status === "loading" ? "Building your program..." : "Ready to Generate"}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          {status === "loading"
            ? "This may take a few seconds"
            : "Review your selections, then hit generate."}
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto 40px",
          background: "#0A0A0A",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#AAAAAA",
            fontFamily: "'Geist Mono', monospace",
          }}
        >
          Program Profile
        </div>
        {summaryItems.map((item, idx) => (
          <div
            key={item.label}
            style={{
              padding: "14px 20px",
              borderBottom:
                idx < summaryItems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
            }}
          >
            <span style={{ color: "#666666", fontSize: "13px", flexShrink: 0 }}>{item.label}</span>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "13px",
                textAlign: "right",
                lineHeight: "1.4",
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div style={{ maxWidth: "360px", margin: "0 auto 40px" }}>
          {[
            "Calculating optimal volume landmarks",
            "Selecting exercises for your equipment",
            "Structuring progressive overload model",
            "Finalising weekly schedule",
          ].map((msg, idx) => (
            <div
              key={msg}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(230,106,35,0.6)",
                  borderTopColor: "#E66A23",
                  animation: `spin 0.9s linear ${idx * 0.15}s infinite`,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {status === "error" && errorMessage && (
        <div
          style={{
            maxWidth: "520px",
            margin: "0 auto 24px",
            padding: "14px 18px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "4px",
            color: "#f87171",
            fontSize: "13px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
        {status !== "loading" && (
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "4px",
              padding: "14px 28px",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            Back
          </button>
        )}

        <button
          onClick={handleGenerate}
          disabled={status === "loading"}
          style={{
            background: status === "loading" ? "rgba(230,106,35,0.5)" : "#E66A23",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "16px 48px",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") e.currentTarget.style.background = "#D1834B";
          }}
          onMouseLeave={(e) => {
            if (status !== "loading") e.currentTarget.style.background = "#E66A23";
          }}
        >
          {status === "loading" ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#ffffff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Generating...
            </>
          ) : (
            <>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {status === "error" ? "Retry" : "Generate My Program"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
