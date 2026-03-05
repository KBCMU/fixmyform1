/**
 * CSV-based Exercise Service
 * Loads exercises from CSV file instead of Supabase
 * Supabase is still used for user data (analysis history, etc.)
 */

import type { Exercise } from "./supabase";

interface CSVExerciseRow {
  exercise: string;
  video_link: string;
  target_muscles: string;
  secondary_muscles: string;
}

/**
 * Parse CSV string into rows
 * Handles format: Exercise Name, Video Link, Primary Muscle, Secondary Muscle 1, Secondary Muscle 2, Secondary Muscle 3
 */
function parseCSV(csvText: string): CSVExerciseRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Find column indices
  const exerciseIdx = headers.findIndex(h =>
    h.toLowerCase().includes('exercise') && h.toLowerCase().includes('name')
  );
  const videoIdx = headers.findIndex(h =>
    h.toLowerCase().includes('video') && h.toLowerCase().includes('link')
  );
  const primaryIdx = headers.findIndex(h =>
    h.toLowerCase().includes('primary') && h.toLowerCase().includes('muscle')
  );

  // Find all secondary muscle columns
  const secondaryIndices: number[] = [];
  headers.forEach((h, idx) => {
    if (h.toLowerCase().includes('secondary') && h.toLowerCase().includes('muscle')) {
      secondaryIndices.push(idx);
    }
  });

  if (exerciseIdx === -1) {
    throw new Error('CSV must have an "Exercise Name" column');
  }

  // Parse data rows
  const rows: CSVExerciseRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted values and commas within values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Last value

    if (values.length <= exerciseIdx) continue;

    const exercise = values[exerciseIdx]?.replace(/^"|"$/g, '') || '';
    const videoLink = videoIdx >= 0 ? (values[videoIdx]?.replace(/^"|"$/g, '') || '') : '';

    // Get primary muscle(s) - handle cases where primary muscle contains commas
    const primaryMuscle = primaryIdx >= 0 ? (values[primaryIdx]?.replace(/^"|"$/g, '') || '') : '';
    // If primary muscle contains commas, split it (e.g., "Front Deltoids, Lateral Deltoids")
    const primaryMuscles = primaryMuscle.split(',').map(m => m.trim()).filter(m => m.length > 0);

    // Collect all secondary muscles from multiple columns
    const secondaryMusclesList: string[] = [];
    secondaryIndices.forEach(idx => {
      if (idx < values.length) {
        const muscle = values[idx]?.replace(/^"|"$/g, '').trim() || '';
        if (muscle) {
          secondaryMusclesList.push(muscle);
        }
      }
    });

    if (exercise) {
      rows.push({
        exercise,
        video_link: videoLink,
        target_muscles: primaryMuscles.join(', '), // Join multiple primary muscles
        secondary_muscles: secondaryMusclesList.join(', '), // Join all secondary muscles
      });
    }
  }

  return rows;
}

/**
 * Parse muscle string (handles comma, pipe, or semicolon separators)
 * Also handles cases where muscle names contain commas (e.g., "Front Deltoids, Lateral Deltoids")
 */
function parseMuscles(muscleString: string): string[] {
  if (!muscleString) return [];

  // Split by comma, but be smart about it
  // Common muscle pairs that contain commas: "Front Deltoids, Lateral Deltoids"
  // We'll split by comma and trim each part
  return muscleString
    .split(',')
    .map(m => m.trim())
    .filter(m => m.length > 0);
}

/**
 * Convert CSV row to Exercise type
 */
function csvRowToExercise(row: CSVExerciseRow): Exercise {
  const targetMuscles = parseMuscles(row.target_muscles);
  const secondaryMuscles = parseMuscles(row.secondary_muscles);

  // Determine category based on muscles (fallback logic)
  let category: Exercise['category'] = 'full-body';
  if (targetMuscles.length > 0) {
    const primary = targetMuscles[0].toLowerCase();
    if (primary.includes('chest') || primary.includes('shoulder') || primary.includes('arm') || primary.includes('bicep') || primary.includes('tricep')) {
      category = 'upper-body';
    } else if (primary.includes('leg') || primary.includes('quad') || primary.includes('hamstring') || primary.includes('glute') || primary.includes('calf')) {
      category = 'lower-body';
    } else if (primary.includes('core') || primary.includes('ab') || primary.includes('oblique')) {
      category = 'core';
    }
  }

  // Generate exercise_id to match the format used in process-reference-videos.ts
  // Format: csv-{exercise-name-lowercase-with-dashes}
  const exerciseId = `csv-${row.exercise.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return {
    id: exerciseId,
    exercise_id: exerciseId,
    name: row.exercise,
    category,
    description: `${row.exercise} exercise targeting ${targetMuscles.join(', ') || 'multiple muscle groups'}.`,
    muscle_groups: [...targetMuscles, ...secondaryMuscles], // Legacy field
    primary_muscles: targetMuscles,
    secondary_muscles: secondaryMuscles,
    exercise_type: targetMuscles.length > 1 ? 'compound' : 'isolation',
    mechanics: targetMuscles.length > 1 ? 'Compound' : 'Isolation',
    force_type: null,
    experience_level: null,
    equipment: ['Barbell'], // Default for barbell exercises
    common_mistakes: [],
    key_points: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Cache for loaded exercises
let cachedExercises: Exercise[] | null = null;

/**
 * Load exercises from CSV file
 */
export async function loadExercisesFromCSV(): Promise<Exercise[]> {
  // Return cached exercises if available
  if (cachedExercises) {
    return cachedExercises;
  }

  try {
    // Try to fetch from public/data directory
    const response = await fetch('/data/barbell_exercises.csv');

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('barbell_exercises.csv not found. Please place it in the public/data/ directory.');
      }
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      throw new Error('CSV file is empty');
    }

    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      throw new Error('No exercises found in CSV file. Please check the format.');
    }

    cachedExercises = rows.map((row) => csvRowToExercise(row));
    return cachedExercises;
  } catch (error) {
    console.error('Error loading exercises from CSV:', error);
    throw error;
  }
}

/**
 * Clear the exercise cache (useful for development/testing)
 */
export function clearExerciseCache(): void {
  cachedExercises = null;
}

/**
 * Get all exercises (from CSV)
 */
export async function getAllExercises(): Promise<Exercise[]> {
  return loadExercisesFromCSV();
}

/**
 * Search exercises (from CSV)
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  const exercises = await loadExercisesFromCSV();
  const lowerQuery = query.toLowerCase();

  return exercises.filter((exercise) => {
    return (
      exercise.name.toLowerCase().includes(lowerQuery) ||
      exercise.category.toLowerCase().includes(lowerQuery) ||
      exercise.primary_muscles.some((muscle) => muscle.toLowerCase().includes(lowerQuery)) ||
      exercise.secondary_muscles.some((muscle) => muscle.toLowerCase().includes(lowerQuery)) ||
      exercise.muscle_groups.some((muscle) => muscle.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get exercise by ID (from CSV)
 */
export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  const exercises = await loadExercisesFromCSV();
  return exercises.find(e => e.id === exerciseId || e.exercise_id === exerciseId) || null;
}

