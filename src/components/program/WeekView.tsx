"use client";

import type { WorkoutDay } from "@/lib/programBuilder/types";

interface WeekViewProps {
  workouts: WorkoutDay[];
  selectedDay: number;
  onSelectDay: (index: number) => void;
}

export default function WeekView({ workouts, selectedDay, onSelectDay }: WeekViewProps) {
  return (
    <div
      className="overflow-x-auto"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>{`.week-view-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div
        className="week-view-scroll flex gap-0 min-w-max"
        style={{ overflowX: "auto", scrollbarWidth: "none" }}
      >
        {workouts.map((workout, idx) => {
          const isRest = workout.exercises.length === 0;
          const isActive = idx === selectedDay && !isRest;

          return (
            <button
              key={idx}
              onClick={() => !isRest && onSelectDay(idx)}
              disabled={isRest}
              style={{
                padding: "14px 20px",
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #E66A23"
                  : "2px solid transparent",
                color: isActive
                  ? "#FFFFFF"
                  : isRest
                  ? "#444444"
                  : "#666666",
                cursor: isRest ? "default" : "pointer",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                transition: "color 0.2s ease, border-color 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                minWidth: "120px",
              }}
              onMouseEnter={(e) => {
                if (!isRest && !isActive) {
                  e.currentTarget.style.color = "#AAAAAA";
                }
              }}
              onMouseLeave={(e) => {
                if (!isRest && !isActive) {
                  e.currentTarget.style.color = "#666666";
                }
              }}
            >
              <span>{workout.dayName}</span>
              {isRest && (
                <span
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#333333",
                    fontWeight: 500,
                  }}
                >
                  Rest
                </span>
              )}
              {!isRest && (
                <span
                  style={{
                    fontSize: "10px",
                    color: isActive ? "rgba(230,106,35,0.7)" : "#444444",
                  }}
                >
                  {workout.exercises.length} exercises
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
