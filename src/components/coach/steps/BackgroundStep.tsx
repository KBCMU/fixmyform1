"use client";

import { useState } from "react";
import type { TrainingBackground } from "@/lib/agent/types";

type BackgroundValue = Partial<Pick<TrainingBackground, "experienceLevel" | "experienceYears">>;

type Props = {
  value: BackgroundValue;
  onChange: (val: BackgroundValue) => void;
  onNext: () => void;
};

const LEVELS = [
  {
    id: "beginner" as const,
    label: "Beginner",
    desc: "Less than 1 year of consistent training",
  },
  {
    id: "intermediate" as const,
    label: "Intermediate",
    desc: "1–3 years, familiar with the basics",
  },
  {
    id: "advanced" as const,
    label: "Advanced",
    desc: "3+ years, strong technique and programming knowledge",
  },
] as const;

export default function BackgroundStep({ value, onChange, onNext }: Props) {
  const [local, setLocal] = useState<BackgroundValue>(value);

  function handleLevelSelect(id: TrainingBackground["experienceLevel"]) {
    const updated = { ...local, experienceLevel: id };
    setLocal(updated);
    onChange(updated);
  }

  function handleYearsChange(years: number) {
    const updated = { ...local, experienceYears: years };
    setLocal(updated);
    onChange(updated);
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 400, color: "#fff", marginBottom: "8px" }}>
        What&apos;s your training background?
      </h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "32px" }}>
        This helps us calibrate advice to your actual level.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
        {LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => handleLevelSelect(lvl.id)}
            style={{
              background: local.experienceLevel === lvl.id ? "rgba(230,106,35,0.15)" : "rgba(255,255,255,0.04)",
              border: local.experienceLevel === lvl.id ? "1px solid #E66A23" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "16px 20px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>{lvl.label}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{lvl.desc}</div>
          </button>
        ))}
      </div>

      {local.experienceLevel && (
        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "8px" }}>
            How many years have you been training? (optional)
          </label>
          <input
            type="number"
            min={0}
            max={40}
            value={local.experienceYears ?? ""}
            onChange={(e) => handleYearsChange(parseInt(e.target.value, 10))}
            placeholder="e.g. 3"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              padding: "10px 14px",
              color: "#fff",
              fontSize: "14px",
              width: "120px",
              outline: "none",
            }}
          />
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!local.experienceLevel}
        style={{
          background: local.experienceLevel ? "#E66A23" : "rgba(255,255,255,0.1)",
          color: local.experienceLevel ? "#fff" : "rgba(255,255,255,0.3)",
          border: "none",
          borderRadius: "6px",
          padding: "12px 28px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: local.experienceLevel ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
        }}
      >
        Continue
      </button>
    </div>
  );
}
