"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedProgram, ExerciseSlot, CatalogExercise } from "@/lib/programBuilder/types";
import WeekView from "./WeekView";
import ExerciseCard from "./ExerciseCard";

interface ProgramViewProps {
  program: GeneratedProgram;
  onSave?: (name: string) => void;
  editable?: boolean;
}

function formatSplitType(type: string): string {
  return type
    .split("_")
    .map((w) => w.toUpperCase())
    .join(" / ");
}

export default function ProgramView({
  program,
  onSave,
  editable = true,
}: ProgramViewProps) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(0);
  const [workouts, setWorkouts] = useState(program.workouts);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const activeWorkout = workouts[selectedDay];

  function handleSwap(slotId: string, newExercise: CatalogExercise) {
    setWorkouts((prev) =>
      prev.map((day, dayIdx) => {
        if (dayIdx !== selectedDay) return day;
        return {
          ...day,
          exercises: day.exercises.map((slot: ExerciseSlot) =>
            slot.id === slotId
              ? { ...slot, selectedExercise: newExercise }
              : slot
          ),
        };
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const programWithSwaps = { ...program, workouts };
      if (onSave) {
        onSave(program.split.name);
        setSaved(true);
      } else {
        // Call save API
        const res = await fetch("/api/program/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(programWithSwaps),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        setSaved(true);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const splitBadge = program.split.type ? formatSplitType(program.split.type) : null;

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* ── Header ── */}
      <section
        style={{
          padding: "32px 0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Split badge */}
            {splitBadge && (
              <div
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  background: "rgba(230,106,35,0.1)",
                  border: "1px solid rgba(230,106,35,0.25)",
                  borderRadius: "2px",
                  color: "#E66A23",
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {splitBadge}
              </div>
            )}

            {/* Program name */}
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
                fontSize: "clamp(28px, 5vw, 52px)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                color: "#FFFFFF",
                marginBottom: "8px",
              }}
            >
              {program.split.name}
            </h1>

            {/* Split description */}
            <p
              style={{
                color: "#AAAAAA",
                fontSize: "14px",
                lineHeight: 1.6,
                maxWidth: "600px",
                marginBottom: program.explanation ? "16px" : "0",
              }}
            >
              {program.split.description}
            </p>

            {/* LLM explanation */}
            {program.explanation && (
              <div
                style={{
                  padding: "14px 16px",
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: "2px solid #E66A23",
                  borderRadius: "0 2px 2px 0",
                  maxWidth: "600px",
                }}
              >
                <p style={{ color: "#AAAAAA", fontSize: "13px", lineHeight: 1.7 }}>
                  {program.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              minWidth: "140px",
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                padding: "12px 20px",
                background: saved ? "rgba(132,204,22,0.15)" : "#84CC16",
                color: saved ? "#84CC16" : "#000000",
                border: saved ? "1px solid rgba(132,204,22,0.3)" : "none",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: saving || saved ? "default" : "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
                opacity: saving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!saving && !saved) {
                  e.currentTarget.style.background = "#65a30d";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && !saved) {
                  e.currentTarget.style.background = "#84CC16";
                }
              }}
            >
              {saving ? "Saving..." : saved ? "Saved" : "Save Program"}
            </button>

            <button
              onClick={() => router.push("/program/new")}
              style={{
                padding: "11px 20px",
                background: "transparent",
                color: "#666666",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "0.03em",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.color = "#AAAAAA";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#666666";
              }}
            >
              Edit Selections
            </button>
          </div>
        </div>

        {/* Save error */}
        {saveError && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "2px",
              color: "#f87171",
              fontSize: "13px",
            }}
          >
            {saveError}
          </div>
        )}
      </section>

      {/* ── Day tab bar ── */}
      <WeekView
        workouts={workouts}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

      {/* ── Exercise list ── */}
      <section style={{ paddingTop: "24px" }}>
        {activeWorkout ? (
          activeWorkout.exercises.length === 0 ? (
            <div
              style={{
                padding: "48px 0",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "2px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg width="20" height="20" fill="none" stroke="#444444" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <p style={{ color: "#444444", fontSize: "14px" }}>Rest day — recovery in progress.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Day heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#AAAAAA",
                  }}
                >
                  {activeWorkout.dayName}
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#444444",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {activeWorkout.exercises.length} exercises
                </span>
              </div>

              {activeWorkout.exercises.map((slot, i) => (
                <ExerciseCard
                  key={slot.id}
                  slot={slot}
                  index={i + 1}
                  onSwap={handleSwap}
                  editable={editable}
                />
              ))}
            </div>
          )
        ) : (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#444444" }}>
            No workout found.
          </div>
        )}
      </section>
    </div>
  );
}
