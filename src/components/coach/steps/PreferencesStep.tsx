"use client";

import { useState } from "react";

type PreferencesValue = {
  preferredEquipment?: string[];
  dietApproach?: string;
  additionalNotes?: string;
};

type Props = {
  value: PreferencesValue;
  onChange: (val: PreferencesValue) => void;
  onNext: () => void;
};

const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbells",
  "Cables",
  "Machines",
  "Bodyweight",
  "Kettlebells",
  "Resistance Bands",
];

const DIET_OPTIONS = [
  { id: "standard", label: "Standard / No restrictions" },
  { id: "high_protein", label: "High protein focus" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "keto", label: "Keto / Low carb" },
  { id: "intermittent_fasting", label: "Intermittent fasting" },
];

export default function PreferencesStep({ value, onChange, onNext }: Props) {
  const [local, setLocal] = useState<PreferencesValue>(value);

  function toggleEquipment(item: string) {
    const current = local.preferredEquipment ?? [];
    const updated = current.includes(item)
      ? current.filter((e) => e !== item)
      : [...current, item];
    const next = { ...local, preferredEquipment: updated };
    setLocal(next);
    onChange(next);
  }

  function handleDiet(id: string) {
    const next = { ...local, dietApproach: id };
    setLocal(next);
    onChange(next);
  }

  function handleNotes(notes: string) {
    const next = { ...local, additionalNotes: notes };
    setLocal(next);
    onChange(next);
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 400, color: "#fff", marginBottom: "8px" }}>
        Equipment &amp; preferences
      </h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "32px" }}>
        Optional — helps personalise exercise selection and nutrition advice.
      </p>

      <div style={{ marginBottom: "28px" }}>
        <label style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Preferred equipment
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {EQUIPMENT_OPTIONS.map((eq) => {
            const selected = (local.preferredEquipment ?? []).includes(eq);
            return (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                style={{
                  background: selected ? "rgba(230,106,35,0.15)" : "rgba(255,255,255,0.04)",
                  border: selected ? "1px solid #E66A23" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: selected ? "#E66A23" : "rgba(255,255,255,0.6)",
                  transition: "all 0.2s ease",
                }}
              >
                {eq}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <label style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Diet approach
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {DIET_OPTIONS.map((diet) => (
            <button
              key={diet.id}
              onClick={() => handleDiet(diet.id)}
              style={{
                background: local.dietApproach === diet.id ? "rgba(230,106,35,0.15)" : "rgba(255,255,255,0.04)",
                border: local.dietApproach === diet.id ? "1px solid #E66A23" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                padding: "10px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                color: local.dietApproach === diet.id ? "#E66A23" : "rgba(255,255,255,0.6)",
                fontSize: "14px",
              }}
            >
              {diet.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <label style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Anything else? (optional)
        </label>
        <textarea
          value={local.additionalNotes ?? ""}
          onChange={(e) => handleNotes(e.target.value)}
          placeholder="Specific goals, lifestyle factors, preferences..."
          rows={3}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            padding: "10px 14px",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={onNext}
        style={{
          background: "#E66A23",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "12px 28px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        Continue
      </button>
    </div>
  );
}
