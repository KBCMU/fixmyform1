/**
 * Show a sample of what's actually stored in Supabase
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function showSample() {
  console.log("📊 Sample of what's stored in Supabase:\n");

  // Get one reference video
  const { data: video } = await supabase
    .from("reference_videos")
    .select("id, title, video_url, frame_count")
    .limit(1)
    .single();

  if (!video) {
    console.log("❌ No videos found");
    return;
  }

  console.log("📹 Reference Video Entry:");
  console.log(`   Title: ${video.title}`);
  console.log(`   Video URL: ${video.video_url}`);
  console.log(`   Frame Count: ${video.frame_count}`);
  console.log(`   Note: Only the YouTube URL is stored, NOT the actual video file\n`);

  // Get a few pose keyframes
  const { data: keyframes } = await supabase
    .from("pose_keyframes")
    .select("frame_number, timestamp_ms, pose_data, confidence")
    .eq("reference_video_id", video.id)
    .order("frame_number")
    .limit(2);

  if (keyframes && keyframes.length > 0) {
    console.log("🎯 Pose Keyframe Data (Sample):");
    keyframes.forEach((kf, i) => {
      console.log(`\n   Frame ${kf.frame_number} (${kf.timestamp_ms}ms):`);
      console.log(`   Confidence: ${kf.confidence.toFixed(3)}`);
      console.log(`   Pose Data Structure:`);
      const poseData = kf.pose_data as any;
      if (poseData.landmarks) {
        console.log(`     - ${poseData.landmarks.length} landmarks`);
        if (poseData.landmarks.length > 0) {
          const sample = poseData.landmarks[0];
          console.log(`     - Sample landmark: {x: ${sample.x?.toFixed(3)}, y: ${sample.y?.toFixed(3)}, z: ${sample.z?.toFixed(3)}, visibility: ${sample.visibility?.toFixed(3)}}`);
        }
      } else {
        console.log(`     - Raw structure:`, JSON.stringify(poseData).substring(0, 200) + "...");
      }
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("📝 Summary:");
  console.log("   ✅ YouTube video URLs are stored (not video files)");
  console.log("   ✅ Pose estimation data (landmarks/coordinates) are stored");
  console.log("   ❌ Videos with pose overlays drawn are NOT stored");
  console.log("   ℹ️  The pose data can be used to draw overlays on-demand");
}

showSample().catch(console.error);


