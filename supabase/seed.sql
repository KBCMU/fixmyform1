-- Seed data for FixMyForm

-- Insert exercises
INSERT INTO exercises (exercise_id, name, category, description, muscle_groups, common_mistakes, key_points)
VALUES 
    (
        'push-up',
        'Push-up',
        'upper-body',
        'Classic bodyweight exercise for chest, shoulders, and triceps',
        ARRAY['Chest', 'Shoulders', 'Triceps', 'Core'],
        ARRAY['Hips sagging or raised too high', 'Elbows flaring out too wide', 'Not going deep enough', 'Head position incorrect'],
        ARRAY['Keep body in straight line from head to heels', 'Elbows at 45-degree angle', 'Lower until chest nearly touches ground', 'Maintain neutral spine']
    ),
    (
        'squat',
        'Squat',
        'lower-body',
        'Fundamental lower body exercise',
        ARRAY['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
        ARRAY['Knees caving inward', 'Not going deep enough', 'Heels lifting off ground', 'Forward lean excessive'],
        ARRAY['Keep chest up and proud', 'Knees track over toes', 'Hips break parallel', 'Weight through heels']
    ),
    (
        'deadlift',
        'Deadlift',
        'lower-body',
        'Full posterior chain compound movement',
        ARRAY['Back', 'Glutes', 'Hamstrings', 'Core'],
        ARRAY['Rounded back', 'Hips rising too fast', 'Bar too far from shins', 'Looking up excessively'],
        ARRAY['Maintain neutral spine', 'Bar close to body', 'Hips and shoulders rise together', 'Lock out at top']
    ),
    (
        'bench-press',
        'Bench Press',
        'upper-body',
        'Compound movement for chest, shoulders, and triceps',
        ARRAY['Chest', 'Shoulders', 'Triceps'],
        ARRAY['Bar path not vertical', 'Feet not planted firmly', 'No arch in lower back', 'Bouncing bar off chest'],
        ARRAY['Plant feet firmly on ground', 'Slight arch in lower back', 'Lower bar to mid-chest', 'Press straight up']
    ),
    (
        'pull-up',
        'Pull-up',
        'upper-body',
        'Bodyweight exercise for back and arm strength',
        ARRAY['Back', 'Biceps', 'Shoulders', 'Core'],
        ARRAY['Using momentum/kipping', 'Not achieving full range of motion', 'Shoulders not engaged at bottom', 'Chin not clearing the bar'],
        ARRAY['Start from dead hang', 'Pull chin over bar', 'Control the descent', 'Keep core tight throughout']
    ),
    (
        'lunge',
        'Lunge',
        'lower-body',
        'Unilateral leg exercise for balance and strength',
        ARRAY['Quadriceps', 'Glutes', 'Hamstrings'],
        ARRAY['Front knee going past toes', 'Leaning forward too much', 'Back knee not lowering enough', 'Poor balance'],
        ARRAY['Keep torso upright', 'Front knee at 90 degrees', 'Back knee nearly touches ground', 'Step through heel']
    ),
    (
        'plank',
        'Plank',
        'core',
        'Isometric core stability exercise',
        ARRAY['Core', 'Shoulders', 'Glutes'],
        ARRAY['Hips sagging', 'Hips too high', 'Head dropped or raised', 'Not breathing'],
        ARRAY['Body forms straight line', 'Engage core throughout', 'Elbows under shoulders', 'Maintain neutral head position']
    );

-- Note: Reference videos would be added after uploading actual videos
-- Example structure (don't run until you have actual videos):
/*
INSERT INTO reference_videos (exercise_id, title, video_url, duration_seconds, frame_count, quality)
VALUES 
    ('push-up', 'Perfect Push-up Form', 'https://your-storage.com/pushup-ref-1.mp4', 15, 450, 'high'),
    ('squat', 'Proper Squat Technique', 'https://your-storage.com/squat-ref-1.mp4', 20, 600, 'high');
*/

