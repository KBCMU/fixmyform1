-- Migration to add detailed exercise information
-- Run this in Supabase SQL Editor

-- Add new columns to exercises table
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS primary_muscles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exercise_type TEXT CHECK (exercise_type IN ('compound', 'isolation', 'cardio', 'flexibility')),
  ADD COLUMN IF NOT EXISTS mechanics TEXT CHECK (mechanics IN ('Compound', 'Isolation', NULL)),
  ADD COLUMN IF NOT EXISTS force_type TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', NULL)),
  ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT '{}';

-- Update muscle_groups to be optional since we now have primary/secondary
ALTER TABLE exercises ALTER COLUMN muscle_groups DROP NOT NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscles ON exercises USING GIN(primary_muscles);
CREATE INDEX IF NOT EXISTS idx_exercises_secondary_muscles ON exercises USING GIN(secondary_muscles);
CREATE INDEX IF NOT EXISTS idx_exercises_exercise_type ON exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercises_experience_level ON exercises(experience_level);

COMMENT ON COLUMN exercises.primary_muscles IS 'Primary target muscles for this exercise';
COMMENT ON COLUMN exercises.secondary_muscles IS 'Secondary muscles involved in this exercise';
COMMENT ON COLUMN exercises.exercise_type IS 'Type of exercise: compound (multi-joint), isolation (single-joint), cardio, or flexibility';
COMMENT ON COLUMN exercises.mechanics IS 'Movement mechanics: Compound or Isolation';
COMMENT ON COLUMN exercises.force_type IS 'Force type: Push, Pull, Static, etc.';
COMMENT ON COLUMN exercises.experience_level IS 'Recommended experience level';
COMMENT ON COLUMN exercises.equipment IS 'Equipment needed for this exercise';

