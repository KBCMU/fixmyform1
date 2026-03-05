"use client";

import { useState, useEffect, useMemo } from "react";
import { EXERCISES } from "@/lib/exercises";
import type { Exercise } from "@/lib/supabase";

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise | null) => void;
  selectedExercise: Exercise | null;
}

export default function ExerciseSelector({
  onSelectExercise,
  selectedExercise,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      const enabledExercises = EXERCISES.filter(ex => ex.enabled === true);
      const mappedExercises = enabledExercises.map(ex => ({
        id: ex.id,
        exercise_id: ex.id,
        name: ex.name,
        category: ex.category,
        muscle_groups: ex.muscleGroups,
        description: ex.description,
        key_points: ex.keyPoints,
        common_mistakes: ex.commonMistakes,
        video_url: "",
        created_at: new Date().toISOString()
      })) as unknown as Exercise[];

      setAllExercises(mappedExercises);
      setError(null);
    } catch (err) {
      console.error("Error loading exercises:", err);
      setError("Failed to load exercises.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return allExercises.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return allExercises.filter((exercise) => {
      return (
        exercise.name.toLowerCase().includes(query) ||
        exercise.category.toLowerCase().includes(query) ||
        exercise.muscle_groups.some((muscle) => muscle.toLowerCase().includes(query))
      );
    }).slice(0, 50);
  }, [searchQuery, allExercises]);

  const handleExerciseClick = (exercise: Exercise) => {
    onSelectExercise(exercise);
    setSearchQuery("");
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div className="p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 rounded w-1/3" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-4 rounded w-2/3" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-4 rounded w-1/2" style={{ background: "var(--bg-elevated)" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
        <p className="font-semibold mb-2" style={{ color: "#f87171" }}>{error}</p>
        <p className="text-sm mt-2" style={{ color: "#fca5a5" }}>
          Check the browser console (F12) for detailed error information.
        </p>
      </div>
    );
  }

  if (selectedExercise) {
    const allMuscles = [
      ...(selectedExercise.primary_muscles || []),
      ...(selectedExercise.secondary_muscles || [])
    ];
    const displayMuscles = allMuscles.length > 0 ? allMuscles : selectedExercise.muscle_groups;
    const primaryMuscle = selectedExercise.primary_muscles?.[0] || selectedExercise.muscle_groups?.[0] || "N/A";
    const exerciseType = selectedExercise.mechanics || selectedExercise.exercise_type || "N/A";

    return (
      <div className="p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--accent-teal)" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              {selectedExercise.name}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {selectedExercise.description}
            </p>
          </div>
          <button
            onClick={() => {
              onSelectExercise(null);
              setSearchQuery("");
            }}
            className="ml-4 px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-teal)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Change
          </button>
        </div>

        {/* Exercise Profile */}
        <div className="mb-4 p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-teal)" }}>
            Exercise Profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              { label: "Target Muscle", value: primaryMuscle },
              { label: "Exercise Type", value: exerciseType },
              ...(selectedExercise.equipment && selectedExercise.equipment.length > 0
                ? [{ label: "Equipment", value: selectedExercise.equipment.join(", ") }]
                : []),
              ...(selectedExercise.mechanics
                ? [{ label: "Mechanics", value: selectedExercise.mechanics }]
                : []),
              ...(selectedExercise.force_type
                ? [{ label: "Force Type", value: selectedExercise.force_type }]
                : []),
              ...(selectedExercise.experience_level
                ? [{ label: "Experience", value: selectedExercise.experience_level }]
                : []),
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-1">
                <span style={{ color: "var(--accent-teal)" }}>{item.label}</span>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>{item.value}</span>
              </div>
            ))}
            {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
              <div className="flex justify-between py-1 col-span-1 md:col-span-2">
                <span style={{ color: "var(--accent-teal)" }}>Secondary Muscles</span>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {selectedExercise.secondary_muscles.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Muscles */}
        <div className="mb-4 flex flex-wrap gap-2">
          {displayMuscles.map((muscle, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs font-medium"
              style={{
                background: selectedExercise.primary_muscles?.includes(muscle)
                  ? "rgba(13, 148, 136, 0.2)"
                  : "var(--bg-elevated)",
                color: selectedExercise.primary_muscles?.includes(muscle)
                  ? "var(--accent-teal)"
                  : "var(--text-secondary)",
                border: `1px solid ${selectedExercise.primary_muscles?.includes(muscle) ? "var(--accent-teal)" : "var(--border-subtle)"}`,
                borderRadius: "2px",
              }}
            >
              {muscle}
              {selectedExercise.primary_muscles?.includes(muscle) && " (Primary)"}
            </span>
          ))}
        </div>

        {/* Key Points + Common Mistakes */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-emerald)" }}>
              Key Points
            </h4>
            <ul className="space-y-2">
              {selectedExercise.key_points.length > 0 ? (
                selectedExercise.key_points.map((point, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="var(--accent-emerald)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {point}
                  </li>
                ))
              ) : (
                <li className="text-sm italic" style={{ color: "var(--text-muted)" }}>No key points available</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--danger)" }}>
              Common Mistakes
            </h4>
            <ul className="space-y-2">
              {selectedExercise.common_mistakes.length > 0 ? (
                selectedExercise.common_mistakes.map((mistake, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {mistake}
                  </li>
                ))
              ) : (
                <li className="text-sm italic" style={{ color: "var(--text-muted)" }}>No common mistakes listed</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder={`Search ${allExercises.length} exercises...`}
          className="w-full px-6 py-4 text-base transition-colors duration-200"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            borderRadius: "2px",
            outline: "none",
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--accent-teal)")}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        />
        <svg
          className="absolute right-6 top-1/2 transform -translate-y-1/2 w-5 h-5"
          fill="none"
          stroke="var(--text-muted)"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {showDropdown && filteredExercises.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {filteredExercises.map((exercise) => {
            const allMuscles = [
              ...(exercise.primary_muscles || []),
              ...(exercise.secondary_muscles || [])
            ];
            const displayMuscles = allMuscles.length > 0 ? allMuscles : (exercise.muscle_groups || []);
            const primaryMuscle = exercise.primary_muscles?.[0] || "";

            return (
              <button
                key={exercise.id}
                onClick={() => handleExerciseClick(exercise)}
                className="w-full px-6 py-4 flex flex-row items-center justify-between transition-colors duration-150 text-left"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex-1 pr-4 min-w-0">
                  <h4 className="font-semibold mb-1 truncate" style={{ color: "var(--text-primary)" }}>
                    {exercise.name}
                  </h4>
                  <p className="text-sm line-clamp-1" style={{ color: "var(--text-muted)" }}>
                    {exercise.description}
                  </p>
                </div>

                {displayMuscles.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[40%]">
                    {displayMuscles.map((muscle, idx) => {
                      return (
                        <span
                          key={idx}
                          className="px-2 py-1 text-[10px] uppercase tracking-widest font-medium"
                          style={{
                            background: "rgba(230, 106, 35, 0.1)",
                            color: "var(--accent-orange)",
                            border: "1px solid rgba(230, 106, 35, 0.2)",
                            borderRadius: "2px",
                          }}
                        >
                          {muscle}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showDropdown && filteredExercises.length === 0 && searchQuery && !loading && (
        <div className="absolute z-10 w-full mt-1 p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p style={{ color: "var(--text-secondary)" }}>No exercises found matching &quot;{searchQuery}&quot;</p>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Try searching by name, muscle group, or category</p>
        </div>
      )}

    </div>
  );
}
