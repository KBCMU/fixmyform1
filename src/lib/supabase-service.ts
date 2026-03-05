/**
 * Supabase Service Layer
 * Functions for interacting with Supabase database
 */

import { supabase } from "./supabase";
import type { Exercise, ReferenceVideo, PoseKeyframe, AnalysisHistory } from "./supabase";
import type { PoseComparisonResult } from "./pose-comparison";
import type { FormFeedback } from "./llm-analysis-claude";
import type { PoseKeypoints } from "./pose-estimation-v2";
import { convertPoseDataToPoseKeypoints } from "./pose-data-converter";

/**
 * Get all exercises
 */
export async function getAllExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch exercises: ${error.message || JSON.stringify(error)}`);
  }

  return data || [];
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("exercise_id", exerciseId)
    .single();

  if (error) {
    console.error("Error fetching exercise:", error);
    return null;
  }

  return data;
}

/**
 * Search exercises
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("name");

  if (error) {
    console.error("Error searching exercises:", error);
    return [];
  }

  return data || [];
}


/**
 * Get user's analysis history
 */
export async function getUserAnalysisHistory(
  userId: string,
  limit: number = 10
): Promise<AnalysisHistory[]> {
  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching analysis history:", error);
    return [];
  }

  return data || [];
}

/**
 * Increment view count for a reference video
 */
export async function incrementVideoViewCount(videoId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_view_count", {
    video_id: videoId,
  });

  if (error) {
    console.error("Error incrementing view count:", error);
  }
}


