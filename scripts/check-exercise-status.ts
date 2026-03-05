/**
 * Check if a specific exercise has reference videos and pose keyframes
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExerciseStatus(exerciseName: string) {
  console.log(`🔍 Checking status for: "${exerciseName}"\n`);

  // First, find the exercise by name
  const { data: exercises, error: exerciseError } = await supabase
    .from("exercises")
    .select("exercise_id, name, category")
    .ilike("name", `%${exerciseName}%`);

  if (exerciseError) {
    console.error("❌ Error fetching exercises:", exerciseError);
    return;
  }

  if (!exercises || exercises.length === 0) {
    console.log(`❌ No exercise found matching "${exerciseName}"`);
    console.log("\n📋 Available exercises:");
    const { data: allExercises } = await supabase
      .from("exercises")
      .select("exercise_id, name")
      .order("name")
      .limit(50);
    
    if (allExercises) {
      allExercises.forEach((e) => {
        console.log(`   - ${e.name} (ID: ${e.exercise_id})`);
      });
    }
    return;
  }

  console.log(`✅ Found ${exercises.length} matching exercise(s):\n`);
  
  for (const exercise of exercises) {
    console.log(`📝 Exercise: ${exercise.name}`);
    console.log(`   ID: ${exercise.exercise_id}`);
    console.log(`   Category: ${exercise.category}\n`);

    // Check for reference videos
    const { data: videos, error: videosError } = await supabase
      .from("reference_videos")
      .select("id, title, video_url, frame_count, is_verified, created_at")
      .eq("exercise_id", exercise.exercise_id);

    if (videosError) {
      console.error("❌ Error fetching reference videos:", videosError);
      continue;
    }

    if (!videos || videos.length === 0) {
      console.log("   ⚠️  No reference videos found!");
      console.log("   💡 Run: npm run process-reference-videos\n");
      continue;
    }

    console.log(`   ✅ Found ${videos.length} reference video(s):`);
    videos.forEach((video) => {
      console.log(`      - ${video.title}`);
      console.log(`        URL: ${video.video_url}`);
      console.log(`        Frames: ${video.frame_count}`);
      console.log(`        Verified: ${video.is_verified ? "Yes" : "No"}`);
      console.log(`        Created: ${new Date(video.created_at).toLocaleString()}`);
    });

    // Check for pose keyframes for each video
    console.log("\n   🎯 Checking pose keyframes:");
    for (const video of videos) {
      const { count: keyframeCount, error: keyframesError } = await supabase
        .from("pose_keyframes")
        .select("*", { count: "exact", head: true })
        .eq("reference_video_id", video.id);

      if (keyframesError) {
        console.error(`      ❌ Error checking keyframes for video ${video.id}:`, keyframesError);
        continue;
      }

      if (keyframeCount === 0) {
        console.log(`      ⚠️  Video "${video.title}": No pose keyframes found!`);
        console.log(`         💡 This video needs to be processed with pose estimation.`);
      } else {
        console.log(`      ✅ Video "${video.title}": ${keyframeCount} pose keyframes`);
      }
    }

    // Summary
    const totalKeyframes = await Promise.all(
      videos.map(async (video) => {
        const { count } = await supabase
          .from("pose_keyframes")
          .select("*", { count: "exact", head: true })
          .eq("reference_video_id", video.id);
        return count || 0;
      })
    );

    const totalKeyframesCount = totalKeyframes.reduce((sum, count) => sum + count, 0);

    console.log(`\n   📊 Summary:`);
    console.log(`      Reference Videos: ${videos.length}`);
    console.log(`      Total Pose Keyframes: ${totalKeyframesCount}`);
    
    if (totalKeyframesCount === 0) {
      console.log(`\n   ❌ This exercise is NOT ready for comparison!`);
      console.log(`   💡 Run: npm run process-reference-videos\n`);
    } else {
      console.log(`\n   ✅ This exercise IS ready for comparison!\n`);
    }
  }
}

// Get exercise name from command line argument or use default
const exerciseName = process.argv[2] || "Stiff Leg Deadlift";

checkExerciseStatus(exerciseName)
  .then(() => {
    console.log("=".repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });


