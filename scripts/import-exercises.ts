/**
 * Main script to import exercises from muscleandstrength.com
 * Orchestrates scraping and uploading
 */

import dotenv from "dotenv";
import { scrapeExerciseList, scrapeExercisePage } from "./scrape-exercises";
import { processExercise } from "./upload-to-supabase";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  console.log("🚀 Starting exercise import process...\n");
  
  // Step 1: Check if we already have scraped data
  const exercisesFile = path.join(process.cwd(), "scripts", "data", "exercises.json");
  let exercises: any[] = [];
  
  if (fs.existsSync(exercisesFile)) {
    console.log("📁 Found existing exercises.json, loading...");
    exercises = JSON.parse(fs.readFileSync(exercisesFile, "utf-8"));
    console.log(`   Loaded ${exercises.length} exercises\n`);
    
    // Check if we should re-scrape (if FORCE_RESCrape env var is set, or if data looks incomplete)
    const forceRescrape = process.env.FORCE_RESCrape === "true";
    const hasIncompleteData = exercises.length > 0 && exercises.length < 500; // Less than expected
    
    if (forceRescrape || hasIncompleteData) {
      console.log("🔄 Re-scraping all exercises (incomplete data detected or FORCE_RESCrape=true)...\n");
      exercises = []; // Clear existing data
    } else {
      // Check if stdin is a TTY (interactive terminal)
      const isTTY = process.stdin.isTTY;
      
      if (isTTY) {
        const readline = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        // Ask user if they want to re-scrape or use existing data
        const answer = await new Promise<string>((resolve) => {
          readline.question(
            "Do you want to:\n  1) Use existing data and upload to Supabase\n  2) Re-scrape all exercises (will take ~30-60 minutes)\n\nEnter 1 or 2: ",
            (ans: string) => {
              readline.close();
              resolve(ans.trim());
            }
          );
        });
        
        if (answer === "2") {
          console.log("\n🔄 Re-scraping all exercises...\n");
          exercises = []; // Clear existing data
        } else {
          console.log("\n✅ Using existing data\n");
        }
      } else {
        // Non-interactive mode - use existing data
        console.log("✅ Using existing data (non-interactive mode)\n");
      }
    }
  }
  
  if (exercises.length === 0) {
    console.log("🔍 Starting fresh scrape from muscleandstrength.com...\n");
    console.log("⏱️  This will take approximately 30-60 minutes for ~1500 exercises.\n");
    
    // Step 2: Scrape exercise list
    const exerciseUrls = await scrapeExerciseList();
    console.log(`\n📋 Found ${exerciseUrls.length} exercise URLs\n`);
    
    if (exerciseUrls.length === 0) {
      console.error("❌ No exercise URLs found. Exiting.");
      process.exit(1);
    }
    
    // Step 3: Scrape each exercise
    const dataDir = path.join(process.cwd(), "scripts", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const startTime = Date.now();
    
    for (let i = 0; i < exerciseUrls.length; i++) {
      const url = exerciseUrls[i];
      const progress = `[${i + 1}/${exerciseUrls.length}]`;
      const percentage = ((i + 1) / exerciseUrls.length * 100).toFixed(1);
      
      process.stdout.write(`\r${progress} (${percentage}%) Scraping...`);
      
      try {
        const exercise = await scrapeExercisePage(url);
        
        if (exercise) {
          exercises.push(exercise);
        } else {
          console.log(`\n⚠️  Invalid exercise data from ${url}`);
        }
      } catch (error) {
        console.error(`\n❌ Error scraping ${url}:`, error instanceof Error ? error.message : error);
      }
      
      // Save progress every 100 exercises
      if ((i + 1) % 100 === 0 || i === exerciseUrls.length - 1) {
        fs.writeFileSync(exercisesFile, JSON.stringify(exercises, null, 2));
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`\n💾 Progress saved: ${exercises.length} exercises (${elapsed} min elapsed)`);
      }
      
      // Rate limiting: 300ms between requests
      if (i < exerciseUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n\n✅ Scraping complete! Saved ${exercises.length} exercises in ${totalTime} minutes\n`);
  }
  
  // Step 4: Upload to Supabase (using direct links - no downloads)
  console.log("📤 Starting upload to Supabase...\n");
  
  let success = 0;
  let failed = 0;
  
  const batchSize = 20; // Process in parallel batches
  
  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);
    const percentage = ((i / exercises.length) * 100).toFixed(1);
    
    process.stdout.write(`\rUploading: ${percentage}% (${i}/${exercises.length})`);
    
    await Promise.all(
      batch.map(async (exercise, idx) => {
        try {
          await processExercise(exercise, i + idx, exercises.length);
          success++;
        } catch (error) {
          failed++;
        }
      })
    );
    
    // Small delay between batches
    if (i + batchSize < exercises.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`🎉 Import complete!`);
  console.log(`${"=".repeat(60)}`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${exercises.length}`);
  console.log(`${"=".repeat(60)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

