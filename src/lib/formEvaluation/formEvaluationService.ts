/**
 * Form Evaluation Service
 * Supabase integration for storing and retrieving form evaluations
 */

import { supabase } from "../supabase";
import type { FormEvaluationResult } from "./types";

export interface StoredFormEvaluation {
    id: string;
    user_id: string | null;
    exercise_name: string;
    video_id?: string;
    evaluation_result: FormEvaluationResult;
    created_at: string;
}

/**
 * Save form evaluation to Supabase
 */
export async function saveFormEvaluation(
    evaluationResult: FormEvaluationResult,
    userId?: string,
    videoId?: string
): Promise<string> {
    const { data, error } = await supabase
        .from("form_evaluations")
        .insert({
            user_id: userId || null,
            exercise_name: evaluationResult.exercise,
            video_id: videoId || null,
            evaluation_result: evaluationResult,
        })
        .select()
        .single();

    if (error) {
        console.error("Error saving form evaluation:", error);
        throw new Error("Failed to save form evaluation");
    }

    return data.id;
}

/**
 * Get form evaluation by ID
 */
export async function getFormEvaluation(
    id: string
): Promise<StoredFormEvaluation | null> {
    const { data, error } = await supabase
        .from("form_evaluations")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching form evaluation:", error);
        return null;
    }

    return data;
}

/**
 * Get user's form evaluation history
 */
export async function getUserFormEvaluations(
    userId: string,
    exerciseName?: string,
    limit: number = 10
): Promise<StoredFormEvaluation[]> {
    let query = supabase
        .from("form_evaluations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (exerciseName) {
        query = query.eq("exercise_name", exerciseName);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching user evaluations:", error);
        return [];
    }

    return data || [];
}

/**
 * Get latest evaluation for a user and exercise
 */
export async function getLatestEvaluation(
    userId: string,
    exerciseName: string
): Promise<StoredFormEvaluation | null> {
    const { data, error } = await supabase
        .from("form_evaluations")
        .select("*")
        .eq("user_id", userId)
        .eq("exercise_name", exerciseName)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching latest evaluation:", error);
        return null;
    }

    return data;
}
