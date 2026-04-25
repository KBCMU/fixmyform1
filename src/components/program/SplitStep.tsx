"use client";

import type { SplitType } from "./types";

interface SplitStepProps {
  daysPerWeek: number;
  selectedSplit?: SplitType;
  onChange: (split: SplitType) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SplitOption {
  value: SplitType;
  name: string;
  description: string;
  recommended?: boolean;
  schedule: string[];
}

function getSplitOptions(days: number): SplitOption[] {
  if (days <= 3) {
    return [
      {
        value: "full_body",
        name: "Full Body",
        description: "Train every major muscle group each session. Ideal for maximizing frequency when sessions are limited.",
        recommended: true,
        schedule:
          days === 2
            ? ["Mon: Full Body", "Thu: Full Body"]
            : ["Mon: Full Body", "Wed: Full Body", "Fri: Full Body"],
      },
    ];
  }

  if (days === 4) {
    return [
      {
        value: "full_body",
        name: "Full Body EOD",
        description: "Every-other-day full body training with a rest day buffer.",
        recommended: true,
        schedule: ["Mon: Full Body", "Tue: Rest", "Wed: Full Body", "Thu: Rest", "Fri: Full Body", "Sat: Full Body"],
      },
      {
        value: "upper_lower",
        name: "Upper / Lower 2×",
        description: "Split upper and lower body over 4 days — classic hypertrophy structure.",
        schedule: ["Mon: Upper", "Tue: Lower", "Thu: Upper", "Fri: Lower"],
      },
      {
        value: "anterior_posterior",
        name: "Anterior / Posterior 2×",
        description: "Front-chain vs back-chain split — excellent balance of push/pull patterns.",
        schedule: ["Mon: Anterior", "Tue: Posterior", "Thu: Anterior", "Fri: Posterior"],
      },
    ];
  }

  if (days === 5) {
    return [
      {
        value: "upper_lower",
        name: "UL Rest Repeat",
        description: "Upper / Lower with an extra day tacked on — high weekly frequency.",
        recommended: true,
        schedule: ["Mon: Upper", "Tue: Lower", "Wed: Rest", "Thu: Upper", "Fri: Lower", "Sat: Upper"],
      },
      {
        value: "anterior_posterior",
        name: "AP Rest Repeat",
        description: "Anterior / Posterior with an extra session — great for posterior chain laggards.",
        recommended: true,
        schedule: ["Mon: Anterior", "Tue: Posterior", "Wed: Rest", "Thu: Anterior", "Fri: Posterior", "Sat: Anterior"],
      },
      {
        value: "upper_lower_ppl",
        name: "UL + PPL Hybrid",
        description: "Combines Upper/Lower structure with a Push/Pull/Legs day for added volume.",
        schedule: ["Mon: Upper", "Tue: Lower", "Wed: Push", "Thu: Rest", "Fri: Pull", "Sat: Legs"],
      },
    ];
  }

  // 6 days
  return [
    {
      value: "upper_lower",
      name: "Upper / Lower 3×",
      description: "Upper and lower body each trained three times per week — maximum frequency.",
      recommended: true,
      schedule: ["Mon: Upper", "Tue: Lower", "Wed: Upper", "Thu: Lower", "Fri: Upper", "Sat: Lower"],
    },
    {
      value: "anterior_posterior",
      name: "Anterior / Posterior 3×",
      description: "Front and back chains alternated across 6 days for balanced hypertrophy.",
      schedule: ["Mon: Anterior", "Tue: Posterior", "Wed: Anterior", "Thu: Posterior", "Fri: Anterior", "Sat: Posterior"],
    },
    {
      value: "push_pull_legs",
      name: "Push / Pull / Legs 2×",
      description: "Classic PPL run twice per week — proven muscle-building structure.",
      schedule: ["Mon: Push", "Tue: Pull", "Wed: Legs", "Thu: Push", "Fri: Pull", "Sat: Legs"],
    },
  ];
}

export default function SplitStep({
  daysPerWeek,
  selectedSplit,
  onChange,
  onNext,
  onBack,
}: SplitStepProps) {
  const options = getSplitOptions(daysPerWeek);

  return (
    <div>
      <div className="mb-10 text-center">
        <h2
          style={{
            fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.02em",
            marginBottom: "8px",
          }}
        >
          Training Split
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          Choose how to structure your {daysPerWeek} training days.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "620px",
          margin: "0 auto 40px",
        }}
      >
        {options.map((option) => {
          const isSelected = selectedSplit === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                background: "#0A0A0A",
                border: `1px solid ${isSelected ? "#E66A23" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "4px",
                padding: "20px 24px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {/* Check */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    width: "20px",
                    height: "20px",
                    background: "#E66A23",
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span
                  style={{
                    color: "rgba(255,255,255,0.95)",
                    fontWeight: 700,
                    fontSize: "17px",
                  }}
                >
                  {option.name}
                </span>
                {option.recommended && (
                  <span
                    style={{
                      background: "rgba(230,106,35,0.15)",
                      color: "#E66A23",
                      border: "1px solid rgba(230,106,35,0.3)",
                      borderRadius: "2px",
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Recommended
                  </span>
                )}
              </div>

              {/* Description */}
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  marginBottom: "14px",
                }}
              >
                {option.description}
              </p>

              {/* Weekly schedule */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {option.schedule.map((day, idx) => {
                  const isRest = day.includes("Rest");
                  return (
                    <span
                      key={idx}
                      style={{
                        background: isRest ? "transparent" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isRest ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "2px",
                        padding: "3px 8px",
                        fontSize: "11px",
                        color: isRest ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.55)",
                        fontFamily: "'Geist Mono', monospace",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
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
        <button
          onClick={onNext}
          disabled={!selectedSplit}
          style={{
            background: selectedSplit ? "#E66A23" : "rgba(255,255,255,0.05)",
            color: selectedSplit ? "#ffffff" : "rgba(255,255,255,0.3)",
            border: "none",
            borderRadius: "4px",
            padding: "14px 40px",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: selectedSplit ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (selectedSplit) e.currentTarget.style.background = "#D1834B";
          }}
          onMouseLeave={(e) => {
            if (selectedSplit) e.currentTarget.style.background = "#E66A23";
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
