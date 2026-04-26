-- Create coach_profiles table
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  training_background JSONB NOT NULL DEFAULT '{}',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: users can CRUD their own profile
CREATE POLICY "Users can view their own coach profile"
  ON coach_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coach profile"
  ON coach_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own coach profile"
  ON coach_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
