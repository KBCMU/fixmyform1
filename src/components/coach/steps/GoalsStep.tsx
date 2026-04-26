"use client";

import { useState } from "react";

type GoalsValue = {
  trainingFrequency?: number;
};

type Props = {
  value: GoalsValue;
  onChange: (val: GoalsValue) => void;
  onNext: () => void;
};

const FREQUENCIES = [2, 3, 4, 5, 6];

export default function GoalsStep({ value, onChange, onNext }: Props) {
  const [local, setLocal] = useState<GoalsValue>(value);

  function handleFreqSelect(freq: number) {
    const updated = { ...local, trainingFrequency: freq };
    setLocal(updated);
    onChange(updated);
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 400, color: "#fff", marginBottom: "8px" }}>
        How often do you train per week?
      </h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "32px" }}>
        We&apos;ll factor this into programming recommendations.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
        {FREQUENCIES.map((freq) => (
          <button
            key={freq}
            onClick={() => handleFreqSelect(freq)}
            style={{
              background: local.trainingFrequency === freq ? "rgba(230,106,35,0.15)" : "rgba(255,255,255,0.04)",
              border: local.trainingFrequency === freq ? "1px solid #E66A23" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "16px 24px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              color: local.trainingFrequency === freq ? "#E66A23" : "rgba(255,255,255,0.7)",
              fontSize: "18px",
              fontWeight: 500,
              minWidth: "70px",
              textAlign: "center",
            }}
          >
            {freq}x
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!local.trainingFrequency}
        style={{
          background: local.trainingFrequency ? "#E66A23" : "rgba(255,255,255,0.1)",
          color: local.trainingFrequency ? "#fff" : "rgba(255,255,255,0.3)",
          border: "none",
          borderRadius: "6px",
          padding: "12px 28px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: local.trainingFrequency ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
        }}
      >
        Continue
      </button>
    </div>
  );
}
