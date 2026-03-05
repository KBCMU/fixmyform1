/**
 * Exercise Database
 * Contains metadata for all supported exercises
 */

export interface Exercise {
  id: string;
  name: string;
  category: "upper-body" | "lower-body" | "core" | "full-body" | "cardio";
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  muscleGroups: string[];
  commonMistakes: string[];
  keyPoints: string[];
  referenceVideoCount?: number;
  enabled?: boolean; // Flag to enable/disable exercises
}

export const EXERCISES: Exercise[] = [
  // Lower Body - Enabled
  {
    id: "leg-extension",
    name: "Leg Extension",
    category: "lower-body",
    difficulty: "beginner",
    description: "Isolation exercise targeting the quadriceps",
    muscleGroups: ["Quadriceps"],
    commonMistakes: [
      "Using momentum to lift weight",
      "Not achieving full extension",
      "Lifting hips off the seat",
      "Excessive forward lean",
      "Locking knees too forcefully"
    ],
    keyPoints: [
      "Keep back firmly against pad",
      "Extend legs to near-full extension (160-180°)",
      "Control the descent",
      "Keep ankles dorsiflexed",
      "Maintain stable hip position"
    ],
    enabled: true
  },

  // Upper Body - Enabled
  {
    id: "machine-pec-deck",
    name: "Machine Pec Deck",
    category: "upper-body",
    difficulty: "beginner",
    description: "Isolation exercise for the chest using a machine fly pattern",
    muscleGroups: ["Chest", "Anterior Deltoid"],
    commonMistakes: [
      "Shoulders shrugging up towards ears",
      "Leaning forward off the seat pad",
      "Incomplete range of motion",
      "Bending wrists excessively"
    ],
    keyPoints: [
      "Keep shoulders depressed and packed down",
      "Maintain contact between back and seat pad",
      "Open arms fully for deep stretch",
      "Squeeze hands together at the midline"
    ],
    enabled: true
  },

  // Upper Body - Disabled
  {
    id: "push-up",
    name: "Push-up",
    category: "upper-body",
    difficulty: "beginner",
    description: "Classic bodyweight exercise for chest, shoulders, and triceps",
    muscleGroups: ["Chest", "Shoulders", "Triceps", "Core"],
    commonMistakes: [
      "Hips sagging or raised too high",
      "Elbows flaring out too wide",
      "Not going deep enough",
      "Head position incorrect"
    ],
    keyPoints: [
      "Keep body in straight line from head to heels",
      "Elbows at 45-degree angle",
      "Lower until chest nearly touches ground",
      "Maintain neutral spine"
    ],
    referenceVideoCount: 5,
    enabled: false
  },
  {
    id: "pull-up",
    name: "Pull-up",
    category: "upper-body",
    difficulty: "intermediate",
    description: "Bodyweight exercise for back and arm strength",
    muscleGroups: ["Back", "Biceps", "Shoulders", "Core"],
    commonMistakes: [
      "Using momentum/kipping",
      "Not achieving full range of motion",
      "Shoulders not engaged at bottom",
      "Chin not clearing the bar"
    ],
    keyPoints: [
      "Start from dead hang",
      "Pull chin over bar",
      "Control the descent",
      "Keep core tight throughout"
    ],
    referenceVideoCount: 4,
    enabled: false
  },
  {
    id: "bench-press",
    name: "Bench Press",
    category: "upper-body",
    difficulty: "intermediate",
    description: "Compound movement for chest, shoulders, and triceps",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    commonMistakes: [
      "Bar path not vertical",
      "Feet not planted firmly",
      "No arch in lower back",
      "Bouncing bar off chest"
    ],
    keyPoints: [
      "Plant feet firmly on ground",
      "Slight arch in lower back",
      "Lower bar to mid-chest",
      "Press straight up"
    ],
    referenceVideoCount: 6,
    enabled: false
  },

  // Lower Body
  {
    id: "squat",
    name: "Squat",
    category: "lower-body",
    difficulty: "beginner",
    description: "Fundamental lower body exercise",
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings", "Core"],
    commonMistakes: [
      "Knees caving inward",
      "Not going deep enough",
      "Heels lifting off ground",
      "Forward lean excessive"
    ],
    keyPoints: [
      "Keep chest up and proud",
      "Knees track over toes",
      "Hips break parallel",
      "Weight through heels"
    ],
    referenceVideoCount: 8,
    enabled: false
  },
  {
    id: "deadlift",
    name: "Deadlift",
    category: "lower-body",
    difficulty: "intermediate",
    description: "Full posterior chain compound movement",
    muscleGroups: ["Back", "Glutes", "Hamstrings", "Core"],
    commonMistakes: [
      "Rounded back",
      "Hips rising too fast",
      "Bar too far from shins",
      "Looking up excessively"
    ],
    keyPoints: [
      "Maintain neutral spine",
      "Bar close to body",
      "Hips and shoulders rise together",
      "Lock out at top"
    ],
    referenceVideoCount: 7,
    enabled: false
  },
  {
    id: "lunge",
    name: "Lunge",
    category: "lower-body",
    difficulty: "beginner",
    description: "Unilateral leg exercise for balance and strength",
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
    commonMistakes: [
      "Front knee going past toes",
      "Leaning forward too much",
      "Back knee not lowering enough",
      "Poor balance"
    ],
    keyPoints: [
      "Keep torso upright",
      "Front knee at 90 degrees",
      "Back knee nearly touches ground",
      "Step through heel"
    ],
    referenceVideoCount: 5,
    enabled: false
  },

  // Core
  {
    id: "plank",
    name: "Plank",
    category: "core",
    difficulty: "beginner",
    description: "Isometric core stability exercise",
    muscleGroups: ["Core", "Shoulders", "Glutes"],
    commonMistakes: [
      "Hips sagging",
      "Hips too high",
      "Head dropped or raised",
      "Not breathing"
    ],
    keyPoints: [
      "Body forms straight line",
      "Engage core throughout",
      "Elbows under shoulders",
      "Maintain neutral head position"
    ],
    referenceVideoCount: 4,
    enabled: false
  },
];

/**
 * Search exercises by name or muscle group
 * Only returns enabled exercises
 */
export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase();
  return EXERCISES.filter(
    (exercise) =>
      (exercise.enabled !== false) && // Only show enabled exercises
      (exercise.name.toLowerCase().includes(lowerQuery) ||
        exercise.muscleGroups.some((muscle) =>
          muscle.toLowerCase().includes(lowerQuery)
        ) ||
        exercise.category.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get exercise by ID
 */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}

/**
 * Get exercises by category
 */
export function getExercisesByCategory(
  category: Exercise["category"]
): Exercise[] {
  return EXERCISES.filter((exercise) => exercise.category === category);
}

