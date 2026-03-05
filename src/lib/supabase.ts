/**
 * Supabase Client Configuration
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (for API routes) - lazy loaded
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export const getSupabaseAdmin = () => {
  if (_supabaseAdmin) return _supabaseAdmin;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not found, using anon key");
    return supabase;
  }

  _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  return _supabaseAdmin;
};

// Type definitions
export interface Exercise {
  id: string;
  exercise_id: string;
  name: string;
  category: "upper-body" | "lower-body" | "core" | "full-body" | "cardio";
  description: string;
  muscle_groups: string[]; // Legacy field, kept for compatibility
  primary_muscles: string[];
  secondary_muscles: string[];
  exercise_type: "compound" | "isolation" | "cardio" | "flexibility" | null;
  mechanics: "Compound" | "Isolation" | null;
  force_type: string | null;
  experience_level: "Beginner" | "Intermediate" | "Advanced" | null;
  equipment: string[];
  common_mistakes: string[];
  key_points: string[];
  created_at: string;
  updated_at: string;
}

export interface ReferenceVideo {
  id: string;
  exercise_id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  frame_count: number;
  quality: "high" | "medium";
  uploaded_by?: string;
  is_verified: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PoseKeyframe {
  id: string;
  reference_video_id: string;
  frame_number: number;
  timestamp_ms: number;
  pose_data: unknown; // PoseKeypoints
  confidence: number;
  embedding?: number[];
  created_at: string;
}

export interface AnalysisHistory {
  id: string;
  user_id?: string;
  exercise_id: string;
  video_url?: string;
  form_score: number;
  overall_similarity: number;
  comparison_data: unknown; // PoseComparisonResult
  feedback_data: unknown; // FormFeedback
  created_at: string;
}

