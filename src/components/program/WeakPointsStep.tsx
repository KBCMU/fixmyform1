"use client";

import { useState } from "react";
import type { MuscleBias } from "./types";

interface WeakPointsStepProps {
  weakPoints: MuscleBias[];
  onChange: (points: MuscleBias[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type MuscleRegion = "chest" | "back" | "shoulders" | "arms" | "legs";

interface SubOption {
  value: MuscleBias;
  label: string;
}

interface RegionConfig {
  region: MuscleRegion;
  label: string;
  subOptions?: SubOption[];
  directBias?: MuscleBias; // used when no sub-options (legs)
}

const REGION_CONFIG: RegionConfig[] = [
  {
    region: "chest",
    label: "Chest",
    subOptions: [
      { value: "chest_upper", label: "Upper Chest" },
      { value: "chest_lower", label: "Lower Chest" },
      { value: "chest_overall", label: "Overall Chest" },
    ],
  },
  {
    region: "back",
    label: "Back (Lats)",
    subOptions: [
      { value: "lats_upper", label: "Upper Lats" },
      { value: "lats_lower", label: "Lower Lats" },
    ],
  },
  {
    region: "shoulders",
    label: "Shoulders",
    subOptions: [
      { value: "delts_front", label: "Front Delts" },
      { value: "delts_lateral", label: "Lateral Delts" },
      { value: "delts_rear", label: "Rear Delts" },
    ],
  },
  {
    region: "arms",
    label: "Arms",
    subOptions: [
      { value: "triceps_long", label: "Triceps — Long Head" },
      { value: "triceps_medial_lateral", label: "Triceps — Medial + Lateral" },
      { value: "biceps_brachialis", label: "Biceps — Brachialis" },
      { value: "biceps_long_short", label: "Biceps — Long + Short Head" },
    ],
  },
  {
    region: "legs",
    label: "Legs",
    directBias: undefined, // legs have no sub-regions — skip drill-down
  },
];

function SelectionChip({
  label,
  selected,
  onClick,
  indent = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? "rgba(230,106,35,0.12)" : "#0A0A0A",
        border: `1px solid ${selected ? "#E66A23" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "4px",
        padding: indent ? "8px 16px" : "10px 20px",
        color: selected ? "#E66A23" : "rgba(255,255,255,0.7)",
        fontWeight: selected ? 600 : 400,
        fontSize: indent ? "12px" : "13px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        marginLeft: indent ? "20px" : "0",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {indent && (
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>↳</span>
      )}
      {label}
      {selected && (
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

export default function WeakPointsStep({
  weakPoints,
  onChange,
  onNext,
  onBack,
}: WeakPointsStepProps) {
  const [expandedRegions, setExpandedRegions] = useState<Set<MuscleRegion>>(new Set());

  const toggleRegion = (region: MuscleRegion) => {
    const config = REGION_CONFIG.find((r) => r.region === region);
    const newExpanded = new Set(expandedRegions);

    if (newExpanded.has(region)) {
      // Collapse: remove region and any sub-biases belonging to it
      newExpanded.delete(region);
      if (config?.subOptions) {
        const toRemove = config.subOptions.map((s) => s.value);
        onChange(weakPoints.filter((wp) => !toRemove.includes(wp)));
      }
    } else {
      newExpanded.add(region);
    }
    setExpandedRegions(newExpanded);
  };

  const toggleBias = (bias: MuscleBias) => {
    if (weakPoints.includes(bias)) {
      onChange(weakPoints.filter((wp) => wp !== bias));
    } else {
      onChange([...weakPoints, bias]);
    }
  };

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
          Weak Points
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          Any specific areas you want to bring up? This step is optional.
        </p>
      </div>

      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto 40px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {REGION_CONFIG.map((config) => {
          const isExpanded = expandedRegions.has(config.region);
          const hasSubOptions = config.subOptions && config.subOptions.length > 0;
          const regionBiasCount = config.subOptions
            ? weakPoints.filter((wp) => config.subOptions!.some((s) => s.value === wp)).length
            : 0;

          return (
            <div key={config.region}>
              {/* Region row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => toggleRegion(config.region)}
                  style={{
                    flex: 1,
                    background: isExpanded ? "rgba(230,106,35,0.08)" : "#0A0A0A",
                    border: `1px solid ${isExpanded ? "rgba(230,106,35,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "4px",
                    padding: "14px 20px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  <span style={{ color: isExpanded ? "#E66A23" : "rgba(255,255,255,0.9)", fontWeight: 500, fontSize: "14px" }}>
                    {config.label}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {regionBiasCount > 0 && (
                      <span
                        style={{
                          background: "rgba(230,106,35,0.2)",
                          color: "#E66A23",
                          borderRadius: "2px",
                          padding: "2px 6px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {regionBiasCount}
                      </span>
                    )}
                    {hasSubOptions ? (
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke={isExpanded ? "#E66A23" : "rgba(255,255,255,0.4)"}
                        viewBox="0 0 24 24"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                        general
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Sub-options drill-down */}
              {isExpanded && hasSubOptions && (
                <div
                  style={{
                    marginTop: "6px",
                    marginLeft: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    paddingLeft: "12px",
                    borderLeft: "1px solid rgba(230,106,35,0.2)",
                  }}
                >
                  {config.subOptions!.map((sub) => (
                    <SelectionChip
                      key={sub.value}
                      label={sub.label}
                      selected={weakPoints.includes(sub.value)}
                      onClick={() => toggleBias(sub.value)}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {weakPoints.length > 0 && (
        <div
          style={{
            maxWidth: "520px",
            margin: "0 auto 24px",
            padding: "14px 18px",
            background: "rgba(230,106,35,0.06)",
            border: "1px solid rgba(230,106,35,0.2)",
            borderRadius: "4px",
            fontSize: "13px",
            color: "#E66A23",
          }}
        >
          <span style={{ fontWeight: 600 }}>{weakPoints.length}</span>{" "}
          weak point{weakPoints.length === 1 ? "" : "s"} selected — your program will bias volume toward these areas.
        </div>
      )}

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
          style={{
            background: "#E66A23",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "14px 40px",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#D1834B";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#E66A23";
          }}
        >
          {weakPoints.length === 0 ? "Skip" : "Continue"}
        </button>
      </div>
    </div>
  );
}
