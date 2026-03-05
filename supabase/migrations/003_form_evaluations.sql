-- Form Evaluations Table
-- Stores deterministic form evaluation results

CREATE TABLE IF NOT EXISTS form_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  video_id TEXT,
  evaluation_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_evaluations_user_id ON form_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_form_evaluations_exercise ON form_evaluations(exercise_name);
CREATE INDEX IF NOT EXISTS idx_form_evaluations_created_at ON form_evaluations(created_at DESC);

-- RLS Policies
ALTER TABLE form_evaluations ENABLE ROW LEVEL SECURITY;

-- Users can read their own evaluations
CREATE POLICY "Users can read own evaluations"
  ON form_evaluations
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own evaluations
CREATE POLICY "Users can insert own evaluations"
  ON form_evaluations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own evaluations
CREATE POLICY "Users can update own evaluations"
  ON form_evaluations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own evaluations
CREATE POLICY "Users can delete own evaluations"
  ON form_evaluations
  FOR DELETE
  USING (auth.uid() = user_id);
