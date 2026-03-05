/**
 * Upload exercises and videos to Supabase
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExerciseData {
  exercise_id: string;
  name: string;
  category: string;
  description: string;
  video_url: string;
  muscle_groups: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  exercise_type: "compound" | "isolation" | "cardio" | "flexibility" | null;
  mechanics: "Compound" | "Isolation" | null;
  force_type: string | null;
  experience_level: "Beginner" | "Intermediate" | "Advanced" | null;
  equipment: string[];
  instructions: string[];
  tips: string[];
  common_mistakes: string[];
  key_points: string[];
}

async function downloadVideo(url: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = url.startsWith("https") ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadVideo(response.headers.location!, outputPath).then(resolve);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        resolve(false);
        return;
      }
      
      response.pipe(file);
      
      file.on("finish", () => {
        file.close();
        resolve(true);
      });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      console.error(`Download error for ${url}:`, err.message);
      resolve(false);
    });
  });
}

async function uploadVideoToSupabase(filePath: string, fileName: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from("reference-videos")
      .upload(fileName, fileBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });
    
    if (error) {
      console.error(`Upload error for ${fileName}:`, error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("reference-videos")
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Upload exception for ${fileName}:`, error);
    return null;
  }
}

async function insertExercise(exercise: ExerciseData): Promise<boolean> {
  try {
    // Insert exercise with new fields
    const { error: exerciseError } = await supabase
      .from("exercises")
      .upsert({
        exercise_id: exercise.exercise_id,
        name: exercise.name,
        category: exercise.category,
        description: exercise.description,
        muscle_groups: exercise.muscle_groups,
        primary_muscles: exercise.primary_muscles,
        secondary_muscles: exercise.secondary_muscles,
        exercise_type: exercise.exercise_type,
        mechanics: exercise.mechanics,
        force_type: exercise.force_type,
        experience_level: exercise.experience_level,
        equipment: exercise.equipment,
        common_mistakes: exercise.common_mistakes,
        key_points: exercise.key_points,
      }, {
        onConflict: "exercise_id",
      });
    
    if (exerciseError) {
      console.error(`Error inserting exercise ${exercise.exercise_id}:`, exerciseError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception inserting exercise ${exercise.exercise_id}:`, error);
    return false;
  }
}

async function insertReferenceVideo(
  exerciseId: string,
  videoUrl: string,
  title: string
): Promise<string | null> {
  try {
    // Default values - videos will be processed later if needed
    const duration_seconds = 30; // Placeholder
    const frame_count = 900; // 30fps * 30s
    
    const { data, error } = await supabase
      .from("reference_videos")
      .insert({
        exercise_id: exerciseId,
        title,
        video_url: videoUrl, // External URL - no download needed
        duration_seconds,
        frame_count,
        quality: "medium", // External videos may vary in quality
        is_verified: false, // Mark as unverified since it's external
      })
      .select()
      .single();
    
    if (error) {
      // If duplicate, try to update instead
      if (error.code === "23505") {
        const { data: updateData } = await supabase
          .from("reference_videos")
          .update({ video_url: videoUrl, title })
          .eq("exercise_id", exerciseId)
          .select()
          .single();
        return updateData?.id || null;
      }
      console.error(`Error inserting reference video:`, error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error(`Exception inserting reference video:`, error);
    return null;
  }
}

async function processExercise(exercise: ExerciseData, index: number, total: number): Promise<void> {
  console.log(`[${index + 1}/${total}] Processing: ${exercise.name}`);
  
  // Insert exercise
  const exerciseInserted = await insertExercise(exercise);
  if (!exerciseInserted) {
    console.log(`  ⚠️  Failed to insert exercise`);
    return;
  }
  
  // Handle video - use direct linking (no download)
  if (exercise.video_url) {
    // Insert reference video with external URL
    const videoId = await insertReferenceVideo(
      exercise.exercise_id,
      exercise.video_url,
      `${exercise.name} - Reference Video`
    );
    
    if (videoId) {
      console.log(`  ✅ Exercise inserted with video link`);
    } else {
      console.log(`  ⚠️  Failed to insert video reference`);
    }
  } else {
    console.log(`  ⚠️  No video URL, inserting exercise without video`);
  }
}

async function main() {
  const exercisesFile = path.join(process.cwd(), "scripts", "data", "exercises.json");
  
  if (!fs.existsSync(exercisesFile)) {
    console.error("❌ exercises.json not found. Run scrape-exercises.ts first.");
    process.exit(1);
  }
  
  const exercises: ExerciseData[] = JSON.parse(
    fs.readFileSync(exercisesFile, "utf-8")
  );
  
  console.log(`Starting upload of ${exercises.length} exercises...`);
  
  // Ensure storage bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === "reference-videos");
  
  if (!bucketExists) {
    console.log("Creating reference-videos bucket...");
    const { error } = await supabase.storage.createBucket("reference-videos", {
      public: true,
    });
    
    if (error) {
      console.error("Failed to create bucket:", error);
      process.exit(1);
    }
  }
  
  let success = 0;
  let failed = 0;
  
  // Process exercises in batches
  const batchSize = 10;
  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map((exercise, idx) =>
        processExercise(exercise, i + idx, exercises.length)
          .then(() => success++)
          .catch(() => failed++)
      )
    );
    
    // Small delay between batches
    if (i + batchSize < exercises.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n✅ Upload complete!`);
  console.log(`   - Success: ${success}`);
  console.log(`   - Failed: ${failed}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { processExercise, insertExercise, insertReferenceVideo };

