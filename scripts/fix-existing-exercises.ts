/**
 * Script to fix existing exercises in Supabase:
 * 1. Fix descriptions that say "kept private"
 * 2. Re-categorize exercises based on muscle groups
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Exercise {
  id: string;
  exercise_id: string;
  name: string;
  category: string;
  description: string;
  muscle_groups: string[];
}

// Improved category detection based on muscle groups
function determineCategory(muscleGroups: string[]): string {
  if (!muscleGroups || muscleGroups.length === 0) {
    return "full-body";
  }

  const upperBodyKeywords = ["chest", "back", "shoulder", "bicep", "tricep", "forearm", "lat", "trap", "pec", "deltoid"];
  const lowerBodyKeywords = ["quad", "hamstring", "glute", "calve", "leg", "thigh", "hip"];
  const coreKeywords = ["ab", "oblique", "core", "lower back"];

  const upperBodyCount = muscleGroups.filter((m) => {
    const mLower = m.toLowerCase();
    return upperBodyKeywords.some((k) => mLower.includes(k));
  }).length;

  const lowerBodyCount = muscleGroups.filter((m) => {
    const mLower = m.toLowerCase();
    return lowerBodyKeywords.some((k) => mLower.includes(k));
  }).length;

  const coreCount = muscleGroups.filter((m) => {
    const mLower = m.toLowerCase();
    return coreKeywords.some((k) => mLower.includes(k));
  }).length;

  // Categorize based on primary muscle groups
  if (upperBodyCount > 0 && lowerBodyCount === 0 && coreCount === 0) {
    return "upper-body";
  } else if (lowerBodyCount > 0 && upperBodyCount === 0 && coreCount === 0) {
    return "lower-body";
  } else if (coreCount > 0 && upperBodyCount === 0 && lowerBodyCount === 0) {
    return "core";
  } else if (upperBodyCount > 0 && lowerBodyCount > 0) {
    return "full-body"; // Truly full body
  } else if (upperBodyCount >= lowerBodyCount && upperBodyCount >= coreCount) {
    return "upper-body"; // Predominantly upper body
  } else if (lowerBodyCount > upperBodyCount && lowerBodyCount > coreCount) {
    return "lower-body"; // Predominantly lower body
  } else if (coreCount > 0) {
    return "core";
  }

  return "full-body";
}

async function fixExercises() {
  console.log("🔧 Fixing existing exercises in Supabase...\n");

  // Fetch all exercises
  const { data: exercises, error: fetchError } = await supabase
    .from("exercises")
    .select("*");

  if (fetchError) {
    console.error("Error fetching exercises:", fetchError);
    return;
  }

  if (!exercises || exercises.length === 0) {
    console.log("No exercises found in database.");
    return;
  }

  console.log(`Found ${exercises.length} exercises to check.\n`);

  let fixedDescriptions = 0;
  let fixedCategories = 0;

  for (const exercise of exercises as Exercise[]) {
    const updates: any = {};
    let needsUpdate = false;

    // Fix description
    if (
      !exercise.description ||
      exercise.description.toLowerCase().includes("kept private") ||
      exercise.description.toLowerCase().includes("will not be shown publicly") ||
      exercise.description.length < 20
    ) {
      updates.description = `Learn how to perform ${exercise.name} with proper form and technique. This exercise targets specific muscle groups and helps build strength.`;
      needsUpdate = true;
      fixedDescriptions++;
    }

    // Fix category
    const correctCategory = determineCategory(exercise.muscle_groups);
    if (exercise.category === "full-body" && correctCategory !== "full-body") {
      updates.category = correctCategory;
      needsUpdate = true;
      fixedCategories++;
      console.log(`  Recategorizing "${exercise.name}": full-body → ${correctCategory}`);
    }

    // Update if needed
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from("exercises")
        .update(updates)
        .eq("id", exercise.id);

      if (updateError) {
        console.error(`  ❌ Error updating ${exercise.name}:`, updateError.message);
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ Fix complete!");
  console.log(`${"=".repeat(60)}`);
  console.log(`   📝 Fixed descriptions: ${fixedDescriptions}`);
  console.log(`   🏷️  Fixed categories: ${fixedCategories}`);
  console.log(`   📊 Total exercises: ${exercises.length}`);
  console.log(`${"=".repeat(60)}\n`);
}

if (require.main === module) {
  fixExercises().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

