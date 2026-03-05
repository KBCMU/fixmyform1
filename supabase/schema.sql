-- FixMyForm Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('upper-body', 'lower-body', 'core', 'full-body', 'cardio')),
    description TEXT NOT NULL,
    muscle_groups TEXT[] NOT NULL,
    common_mistakes TEXT[] NOT NULL,
    key_points TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reference videos table
CREATE TABLE reference_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id TEXT NOT NULL REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER NOT NULL,
    frame_count INTEGER NOT NULL,
    quality TEXT NOT NULL CHECK (quality IN ('high', 'medium')),
    uploaded_by TEXT,
    is_verified BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Pose keyframes table (stores extracted poses from reference videos)
CREATE TABLE pose_keyframes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_video_id UUID NOT NULL REFERENCES reference_videos(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    pose_data JSONB NOT NULL, -- Stores the PoseKeypoints
    confidence FLOAT NOT NULL,
    embedding vector(128), -- For similarity search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(reference_video_id, frame_number)
);

-- User analysis history
CREATE TABLE analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT, -- Can be null for anonymous users
    exercise_id TEXT NOT NULL REFERENCES exercises(exercise_id),
    video_url TEXT,
    form_score INTEGER NOT NULL CHECK (form_score >= 0 AND form_score <= 100),
    overall_similarity FLOAT NOT NULL,
    comparison_data JSONB NOT NULL, -- Stores PoseComparisonResult
    feedback_data JSONB NOT NULL, -- Stores FormFeedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for better query performance
CREATE INDEX idx_exercises_exercise_id ON exercises(exercise_id);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_reference_videos_exercise_id ON reference_videos(exercise_id);
CREATE INDEX idx_pose_keyframes_video_id ON pose_keyframes(reference_video_id);
CREATE INDEX idx_pose_keyframes_embedding ON pose_keyframes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX idx_analysis_history_exercise_id ON analysis_history(exercise_id);
CREATE INDEX idx_analysis_history_created_at ON analysis_history(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pose_keyframes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Public read access for exercises
CREATE POLICY "Exercises are viewable by everyone" 
    ON exercises FOR SELECT 
    USING (true);

-- Public read access for reference videos
CREATE POLICY "Reference videos are viewable by everyone" 
    ON reference_videos FOR SELECT 
    USING (true);

-- Public read access for pose keyframes
CREATE POLICY "Pose keyframes are viewable by everyone" 
    ON pose_keyframes FOR SELECT 
    USING (true);

-- Users can only see their own analysis history
CREATE POLICY "Users can view their own analysis history" 
    ON analysis_history FOR SELECT 
    USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Users can insert their own analysis
CREATE POLICY "Users can insert their own analysis" 
    ON analysis_history FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reference_videos_updated_at BEFORE UPDATE ON reference_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

