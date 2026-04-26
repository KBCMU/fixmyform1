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
      user_programs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          profile: unknown;
          program_data: unknown;
          llm_explanation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          profile: unknown;
          program_data: unknown;
          llm_explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          profile?: unknown;
          program_data?: unknown;
          llm_explanation?: string | null;
          updated_at?: string;
        };
      };
      coach_profiles: {
        Row: {
          id: string;
          user_id: string;
          training_background: Record<string, unknown>;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          training_background?: Record<string, unknown>;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          training_background?: Record<string, unknown>;
          onboarding_complete?: boolean;
          updated_at?: string;
        };
      };
      coach_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          updated_at?: string;
        };
      };
      coach_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string | null;
          tool_data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content?: string | null;
          tool_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          content?: string | null;
          tool_data?: Record<string, unknown> | null;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subscription: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subscription?: Record<string, unknown>;
          updated_at?: string;
        };
      };
    };
  };
};


