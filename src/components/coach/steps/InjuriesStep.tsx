"use client";

import { useState } from "react";

type InjuriesValue = {
  injuries?: string[];
};

type Props = {
  value: InjuriesValue;
  onChange: (val: InjuriesValue) => void;
  onNext: () => void;
};

export default function InjuriesStep({ value, onChange, onNext }: Props) {
  const [local, setLocal] = useState<InjuriesValue>(value);
  const [input, setInput] = useState("");

  function addInjury() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const updated = {
      ...local,
      injuries: [...(local.injuries ?? []), trimmed],
    };
    setLocal(updated);
    onChange(updated);
    setInput("");
  }

  function removeInjury(index: number) {
    const updated = {
      ...local,
      injuries: (local.injuries ?? []).filter((_, i) => i !== index),
    };
    setLocal(updated);
    onChange(updated);
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 400, color: "#fff", marginBottom: "8px" }}>
        Any injuries or limitations?
      </h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "32px" }}>
        The coach will work around these when giving advice. Skip if none.
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addInjury();
          }}
          placeholder="e.g. Lower back pain, bad shoulder..."
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            padding: "10px 14px",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={addInjury}
          style={{
            background: "#E66A23",
            border: "none",
            borderRadius: "6px",
            padding: "10px 16px",
            color: "#fff",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>

      {(local.injuries ?? []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
          {(local.injuries ?? []).map((inj, i) => (
            <span
              key={i}
              style={{
                background: "rgba(230,106,35,0.15)",
                border: "1px solid rgba(230,106,35,0.3)",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "13px",
                color: "#E66A23",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {inj}
              <button
                onClick={() => removeInjury(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#E66A23",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "14px",
                  lineHeight: 1,
                  opacity: 0.7,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

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
