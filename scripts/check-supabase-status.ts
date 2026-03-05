/**
 * Quick script to check if reference videos and pose keyframes were saved to Supabase
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatus() {
  console.log("🔍 Checking Supabase status...\n");

  // Check reference videos
  const { data: videos, error: videosError } = await supabase
    .from("reference_videos")
    .select("id, title, exercise_id, frame_count, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (videosError) {
    console.error("❌ Error fetching reference videos:", videosError);
  } else {
    console.log(`📹 Reference Videos: ${videos?.length || 0} found`);
    if (videos && videos.length > 0) {
      console.log("   Recent videos:");
      videos.forEach((v) => {
        console.log(`   - ${v.title} (${v.frame_count} frames)`);
      });
    }
  }

  // Check pose keyframes
  const { count: keyframesCount, error: keyframesError } = await supabase
    .from("pose_keyframes")
    .select("*", { count: "exact", head: true });

  if (keyframesError) {
    console.error("❌ Error fetching pose keyframes:", keyframesError);
  } else {
    console.log(`\n🎯 Pose Keyframes: ${keyframesCount || 0} total`);
  }

  // Check exercises
  const { count: exercisesCount, error: exercisesError } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true });

  if (exercisesError) {
    console.error("❌ Error fetching exercises:", exercisesError);
  } else {
    console.log(`\n💪 Exercises: ${exercisesCount || 0} total`);
  }

  console.log("\n" + "=".repeat(60));
  if (videos && videos.length > 0 && keyframesCount && keyframesCount > 0) {
    console.log("✅ Data has been saved to Supabase!");
  } else {
    console.log("⚠️  No data found in Supabase yet.");
    console.log("   The script may still be running or encountered errors.");
  }
}

checkStatus().catch(console.error);


