/**
 * Database types (basic structure)
 * You can generate full types from Supabase CLI if needed
 */

export type Database = {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          exercise_id: string;
          name: string;
          category: string;
          description: string;
          muscle_groups: string[];
          common_mistakes: string[];
          key_points: string[];
          created_at: string;
          updated_at: string;
        };
      };
      reference_videos: {
        Row: {
          id: string;
          exercise_id: string;
          title: string;
          video_url: string;
          duration_seconds: number;
          frame_count: number;
          quality: string;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      pose_keyframes: {
        Row: {
          id: string;
          reference_video_id: string;
          frame_number: number;
          timestamp_ms: number;
          pose_data: unknown;
          confidence: number;
          created_at: string;
        };
      };
      analysis_history: {
        Row: {
          id: string;
          user_id: string | null;
          exercise_id: string;
          video_url: string | null;
          form_score: number;
          overall_similarity: number;
          comparison_data: unknown;
          feedback_data: unknown;
          created_at: string;
        };
      };
    };
  };
};


