"use client";

import type { ExperienceLevel } from "./types";

interface ExperienceStepProps {
  value: ExperienceLevel | undefined;
  onChange: (level: ExperienceLevel) => void;
  onNext: () => void;
}

const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "never",
    label: "Never trained",
    subtitle: "I'm completely new to the gym",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    value: "beginner",
    label: "0–1 years",
    subtitle: "I've been training for less than a year",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    value: "intermediate",
    label: "1–3 years",
    subtitle: "I have some solid experience",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    value: "advanced",
    label: "3+ years",
    subtitle: "I'm an experienced lifter",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

export default function ExperienceStep({ value, onChange, onNext }: ExperienceStepProps) {
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
          Training Experience
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          How long have you been training consistently?
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          maxWidth: "600px",
          margin: "0 auto 40px",
        }}
      >
        {EXPERIENCE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                background: "#0A0A0A",
                border: `1px solid ${isSelected ? "#E66A23" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "4px",
                padding: "24px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                textAlign: "left",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }
              }}
            >
              {/* Check icon */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
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

              <div style={{ color: isSelected ? "#E66A23" : "rgba(255,255,255,0.5)" }}>
                {option.icon}
              </div>

              <div>
                <div
                  style={{
                    color: isSelected ? "#ffffff" : "rgba(255,255,255,0.9)",
                    fontWeight: 600,
                    fontSize: "16px",
                    marginBottom: "4px",
                  }}
                >
                  {option.label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.4" }}>
                  {option.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={onNext}
          disabled={!value}
          style={{
            background: value ? "#E66A23" : "rgba(255,255,255,0.05)",
            color: value ? "#ffffff" : "rgba(255,255,255,0.3)",
            border: "none",
            borderRadius: "4px",
            padding: "14px 40px",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: value ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (value) e.currentTarget.style.background = "#D1834B";
          }}
          onMouseLeave={(e) => {
            if (value) e.currentTarget.style.background = "#E66A23";
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
