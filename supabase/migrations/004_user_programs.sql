-- Create user_programs table
CREATE TABLE user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  profile JSONB NOT NULL,
  program_data JSONB NOT NULL,
  llm_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own programs
CREATE POLICY "Users can view their own programs"
  ON user_programs FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own programs
CREATE POLICY "Users can insert their own programs"
  ON user_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own programs
CREATE POLICY "Users can update their own programs"
  ON user_programs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own programs
CREATE POLICY "Users can delete their own programs"
  ON user_programs FOR DELETE
  USING (auth.uid() = user_id);

-- Create index on user_id for efficient queries
CREATE INDEX idx_user_programs_user_id ON user_programs(user_id);
