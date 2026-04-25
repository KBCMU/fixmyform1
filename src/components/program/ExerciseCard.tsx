"use client";

import { useState } from "react";
import type { ExerciseSlot, CatalogExercise } from "@/lib/programBuilder/types";

interface ExerciseCardProps {
  slot: ExerciseSlot;
  index: number;
  onSwap: (slotId: string, newExercise: CatalogExercise) => void;
  editable?: boolean;
}

function formatMovementPattern(pattern: string): string {
  return pattern
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatMuscleBias(bias: string): string {
  return bias
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatLengthTension(lt: string): string {
  return lt
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getYouTubeEmbedUrl(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  return null;
}

export default function ExerciseCard({
  slot,
  index,
  onSwap,
  editable = true,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const ex = slot.selectedExercise;

  const equipmentLabel = ex.equipment.join(", ");
  const muscleLabel =
    ex.primaryMuscles.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ");

  const embedUrl = ex.referenceVideoUrl ? getYouTubeEmbedUrl(ex.referenceVideoUrl) : null;
  const isInstagram = ex.referenceVideoUrl?.includes("instagram.com");

  const profileRows = [
    { label: "Target Muscle", value: slot.targetMuscle.charAt(0).toUpperCase() + slot.targetMuscle.slice(1) },
    { label: "Movement", value: formatMovementPattern(slot.movementPattern) },
    { label: "Equipment", value: equipmentLabel },
    ...(ex.muscleBias ? [{ label: "Bias", value: formatMuscleBias(ex.muscleBias) }] : []),
    ...(ex.lengthTension ? [{ label: "Length-Tension", value: formatLengthTension(ex.lengthTension) }] : []),
    { label: "Taxingness", value: ex.taxingness.charAt(0).toUpperCase() + ex.taxingness.slice(1) },
  ];

  return (
    <div
      style={{
        background: expanded ? "#0F0F0F" : "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "3px",
        transition: "background 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Header row — always visible, clickable */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          textAlign: "left",
        }}
      >
        {/* Index number */}
        <span
          style={{
            color: "#E66A23",
            fontWeight: 700,
            fontSize: "13px",
            minWidth: "20px",
            flexShrink: 0,
            paddingTop: "1px",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {index}.
        </span>

        {/* Name + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "15px",
              lineHeight: 1.3,
            }}
          >
            {ex.name}
          </div>
          <div
            style={{
              color: "#666666",
              fontSize: "12px",
              marginTop: "3px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                color: "#E66A23",
                opacity: 0.6,
                fontSize: "10px",
              }}
            >
              {expanded ? "▾" : "▸"}
            </span>
            {equipmentLabel} · {muscleLabel}
          </div>
        </div>

        {/* Sets × reps */}
        <span
          style={{
            color: "#AAAAAA",
            fontFamily: "var(--font-mono), 'Geist Mono', monospace",
            fontSize: "13px",
            fontWeight: 500,
            flexShrink: 0,
            paddingTop: "2px",
          }}
        >
          {slot.sets} × {slot.repRange[0]}–{slot.repRange[1]}
        </span>
      </button>

      {/* Expanded content — grid animation trick */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.28s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "0 20px 20px 52px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

            {/* Profile grid */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#E66A23",
                  marginBottom: "10px",
                  fontWeight: 600,
                }}
              >
                Exercise Profile
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "6px 24px",
                }}
              >
                {profileRows.map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "8px",
                      padding: "5px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span
                      style={{
                        color: "#666666",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono), monospace",
                        letterSpacing: "0.05em",
                        flexShrink: 0,
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        color: "#AAAAAA",
                        fontSize: "12px",
                        fontWeight: 500,
                        textAlign: "right",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technique cues */}
            {ex.techniqueCues && ex.techniqueCues.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#0D9488",
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  Technique Cues
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
                  {ex.techniqueCues.map((cue, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontSize: "13px",
                        color: "#AAAAAA",
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "1px",
                          background: "#0D9488",
                          flexShrink: 0,
                          marginTop: "7px",
                        }}
                      />
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reference video */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#666666",
                  marginBottom: "10px",
                  fontWeight: 600,
                }}
              >
                Reference Video
              </div>
              {embedUrl ? (
                <div>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "56.25%", // 16:9
                      background: "#050505",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      src={embedUrl}
                      title={`${ex.name} reference video`}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {ex.referenceVideoCredit && (
                    <p
                      style={{
                        marginTop: "6px",
                        fontSize: "11px",
                        color: "#444444",
                        fontStyle: "italic",
                      }}
                    >
                      Credit: {ex.referenceVideoCredit}
                    </p>
                  )}
                </div>
              ) : isInstagram && ex.referenceVideoUrl ? (
                <div>
                  <a
                    href={ex.referenceVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      background: "#0F0F0F",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "2px",
                      color: "#AAAAAA",
                      fontSize: "13px",
                      textDecoration: "none",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    View on Instagram
                    {ex.referenceVideoCredit && (
                      <span style={{ color: "#555555" }}>· {ex.referenceVideoCredit}</span>
                    )}
                  </a>
                </div>
              ) : (
                <div
                  style={{
                    padding: "16px",
                    background: "#050505",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="#444444"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span style={{ color: "#444444", fontSize: "12px", fontStyle: "italic" }}>
                    No reference video yet
                  </span>
                </div>
              )}
            </div>

            {/* Swap dropdown */}
            {editable && slot.alternatives && slot.alternatives.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#666666",
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  Swap Exercise
                </div>
                <select
                  value={ex.id}
                  onChange={(e) => {
                    const chosen = [ex, ...slot.alternatives].find(
                      (a) => a.id === e.target.value
                    );
                    if (chosen && chosen.id !== ex.id) {
                      onSwap(slot.id, chosen);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0A0A0A",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "2px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: "36px",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0D9488";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <option value={ex.id}>{ex.name} (current)</option>
                  {slot.alternatives.map((alt) => (
                    <option key={alt.id} value={alt.id}>
                      {alt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
