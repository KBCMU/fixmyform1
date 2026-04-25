"use client";

import type { GymType } from "./types";

interface LocationStepProps {
  value: GymType | undefined;
  onChange: (type: GymType) => void;
  onNext: () => void;
  onBack: () => void;
}

const GYM_OPTIONS: {
  value: GymType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "commercial",
    label: "Commercial Gym",
    description: "Full access to machines, cables, and free weights",
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: "home",
    label: "Home Gym",
    description: "Dumbbells, bench, and basic equipment",
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    value: "hotel",
    label: "Hotel / Travel",
    description: "Minimal equipment, bodyweight focus",
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
];

export default function LocationStep({ value, onChange, onNext, onBack }: LocationStepProps) {
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
          Training Location
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          Where will you be training?
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          maxWidth: "520px",
          margin: "0 auto 40px",
        }}
      >
        {GYM_OPTIONS.map((option) => {
          const isSelected = value === option.value;
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
                display: "flex",
                alignItems: "center",
                gap: "20px",
                textAlign: "left",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateX(0)";
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

              <div style={{ color: isSelected ? "#E66A23" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                {option.icon}
              </div>

              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 600,
                    fontSize: "16px",
                    marginBottom: "4px",
                  }}
                >
                  {option.label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>
                  {option.description}
                </div>
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
