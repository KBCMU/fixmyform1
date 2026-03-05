/**
 * Check how many exercises from CSV have been processed
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatus() {
  // Read CSV
  const csvPath = path.join(process.cwd(), "public", "data", "barbell_exercises.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  
  const exercises: Array<{ name: string; videoUrl: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const name = values[0]?.trim();
    const videoUrl = values[1]?.trim();
    if (name && videoUrl) {
      exercises.push({ name, videoUrl });
    }
  }

  console.log(`📋 Total exercises in CSV: ${exercises.length}\n`);

  // Get all reference videos
  const { data: videos, error } = await supabase
    .from("reference_videos")
    .select("title, video_url, frame_count");

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  console.log(`📹 Reference videos in Supabase: ${videos?.length || 0}\n`);

  // Match CSV exercises with saved videos
  const processed: string[] = [];
  const notProcessed: string[] = [];

  for (const exercise of exercises) {
    const found = videos?.find(
      (v) =>
        v.video_url === exercise.videoUrl ||
        v.title.includes(exercise.name)
    );
    if (found && found.frame_count > 0) {
      processed.push(exercise.name);
    } else {
      notProcessed.push(exercise.name);
    }
  }

  console.log(`✅ Processed: ${processed.length}/${exercises.length}`);
  if (processed.length > 0) {
    console.log("   Examples:", processed.slice(0, 5).join(", "));
  }

  console.log(`\n⏳ Not yet processed: ${notProcessed.length}/${exercises.length}`);
  if (notProcessed.length > 0 && notProcessed.length <= 10) {
    console.log("   Remaining:", notProcessed.join(", "));
  } else if (notProcessed.length > 10) {
    console.log("   Remaining:", notProcessed.slice(0, 10).join(", "), "...");
  }

  console.log(`\n📊 Progress: ${((processed.length / exercises.length) * 100).toFixed(1)}%`);
}

checkStatus().catch(console.error);


