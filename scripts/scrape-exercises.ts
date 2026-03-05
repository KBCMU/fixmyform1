/**
 * Scraper for muscleandstrength.com/exercises
 * Extracts exercise data and video URLs
 */

import dotenv from "dotenv";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// Load environment variables (if needed)
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

interface ExerciseData {
  exercise_id: string;
  name: string;
  category: string;
  description: string;
  video_url: string;
  muscle_groups: string[]; // All muscles combined
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

const BASE_URL = "https://www.muscleandstrength.com";
const EXERCISES_URL = `${BASE_URL}/exercises`;

// Map M&S categories and muscle groups to our categories
const CATEGORY_MAP: Record<string, string> = {
  // Upper body muscle groups
  "chest": "upper-body",
  "back": "upper-body",
  "shoulders": "upper-body",
  "biceps": "upper-body",
  "triceps": "upper-body",
  "forearms": "upper-body",
  "lats": "upper-body",
  "traps": "upper-body",
  "middle back": "upper-body",
  "upper back": "upper-body",
  "pectorals": "upper-body",
  "deltoids": "upper-body",
  // Core muscle groups
  "abs": "core",
  "obliques": "core",
  "core": "core",
  "abdominals": "core",
  "lower back": "core",
  // Lower body muscle groups
  "quads": "lower-body",
  "quadriceps": "lower-body",
  "hamstrings": "lower-body",
  "glutes": "lower-body",
  "calves": "lower-body",
  "legs": "lower-body",
  "thighs": "lower-body",
  "hips": "lower-body",
  // Other
  "cardio": "cardio",
  "full-body": "full-body",
  "full body": "full-body",
};

// Removed difficulty estimation - difficulty field no longer needed

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  
  return await response.text();
}

async function scrapeExerciseList(): Promise<string[]> {
  console.log("Fetching all exercise links from muscleandstrength.com...");
  const exerciseLinks: Set<string> = new Set();
  
  // Strategy: Fetch the sitemap or navigate through all pages
  // Start with main categories and equipment types
  const categoriesToScrape = [
    // Muscle groups
    `${BASE_URL}/exercises/chest`,
    `${BASE_URL}/exercises/back`,
    `${BASE_URL}/exercises/shoulders`,
    `${BASE_URL}/exercises/biceps`,
    `${BASE_URL}/exercises/triceps`,
    `${BASE_URL}/exercises/forearms`,
    `${BASE_URL}/exercises/abs`,
    `${BASE_URL}/exercises/obliques`,
    `${BASE_URL}/exercises/quads`,
    `${BASE_URL}/exercises/hamstrings`,
    `${BASE_URL}/exercises/glutes`,
    `${BASE_URL}/exercises/calves`,
    `${BASE_URL}/exercises/lower-back`,
    `${BASE_URL}/exercises/middle-back`,
    `${BASE_URL}/exercises/lats`,
    `${BASE_URL}/exercises/traps`,
    `${BASE_URL}/exercises/neck`,
    // Equipment
    `${BASE_URL}/exercises/barbell`,
    `${BASE_URL}/exercises/dumbbell`,
    `${BASE_URL}/exercises/bodyweight`,
    `${BASE_URL}/exercises/cable`,
    `${BASE_URL}/exercises/machine`,
    `${BASE_URL}/exercises/kettlebell`,
    `${BASE_URL}/exercises/bands`,
    `${BASE_URL}/exercises/medicine-ball`,
    `${BASE_URL}/exercises/foam-roll`,
    `${BASE_URL}/exercises/exercise-ball`,
    `${BASE_URL}/exercises/ez-bar`,
  ];
  
  console.log(`Scanning ${categoriesToScrape.length} category pages...`);
  
  for (let i = 0; i < categoriesToScrape.length; i++) {
    const categoryUrl = categoriesToScrape[i];
    console.log(`[${i + 1}/${categoriesToScrape.length}] Scanning: ${categoryUrl}`);
    
    try {
      const html = await fetchPage(categoryUrl);
      const $ = cheerio.load(html);
      
      // Find all exercise links on this category page
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.includes("/exercises/") && href.endsWith(".html")) {
          let fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
          fullUrl = fullUrl.split("?")[0].split("#")[0];
          
          // Only add individual exercise pages (end with .html)
          if (fullUrl.includes("/exercises/") && fullUrl.endsWith(".html")) {
            exerciseLinks.add(fullUrl);
          }
        }
      });
      
      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error scanning ${categoryUrl}:`, error);
    }
  }
  
  // Also scrape the main exercises directory page
  try {
    console.log("Scanning main exercises directory...");
    const html = await fetchPage(`${BASE_URL}/exercises/directory`);
    const $ = cheerio.load(html);
    
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("/exercises/") && href.endsWith(".html")) {
        let fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        fullUrl = fullUrl.split("?")[0].split("#")[0];
        if (fullUrl.endsWith(".html")) {
          exerciseLinks.add(fullUrl);
        }
      }
    });
  } catch (error) {
    console.log("No directory page found, continuing with category results...");
  }
  
  const links = Array.from(exerciseLinks).sort();
  console.log(`\n✅ Found ${links.length} unique exercise links`);
  return links;
}

async function scrapeExercisePage(url: string): Promise<ExerciseData | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    // Extract exercise name - try multiple selectors
    const nameSelectors = [
      "h1.exercise-title",
      "h1",
      ".exercise-name",
      "[data-exercise-name]",
      "title",
    ];
    
    let name = "";
    for (const selector of nameSelectors) {
      name = $(selector).first().text().trim();
      if (name && name.length > 0 && name.length < 100) break;
    }
    
    // Fallback: extract from URL
    if (!name || name.length === 0) {
      const urlParts = url.split("/");
      name = urlParts[urlParts.length - 1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    
    if (!name || name.toLowerCase().includes("exercises")) {
      console.warn(`Invalid name for ${url}: ${name}`);
      return null;
    }
    
    // Generate exercise_id from name
    const exercise_id = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    // Extract description - try multiple selectors
    const descSelectors = [
      ".exercise-description",
      ".description",
      "meta[name='description']",
      ".content p",
      "p:first-of-type",
    ];
    
    let description = "";
    for (const selector of descSelectors) {
      if (selector.startsWith("meta")) {
        description = $(selector).attr("content") || "";
      } else {
        description = $(selector).first().text().trim();
      }
      
      // Skip bad descriptions
      if (description && 
          description.length > 20 && 
          !description.toLowerCase().includes("kept private") &&
          !description.toLowerCase().includes("will not be shown publicly")) {
        break;
      } else {
        description = "";
      }
    }
    
    // If no good description found, generate one
    if (!description || description.length < 20) {
      description = `Learn how to perform ${name} with proper form and technique. This exercise targets specific muscle groups and helps build strength.`;
    }
    
    // Extract video URL - try multiple strategies
    let video_url = "";
    const videoSelectors = [
      "video source[src]",
      "iframe[src*='youtube']",
      "iframe[src*='vimeo']",
      "[data-video-url]",
      ".video-wrapper iframe",
      ".exercise-video source",
    ];
    
    for (const selector of videoSelectors) {
      const element = $(selector).first();
      if (element.length) {
        video_url = element.attr("src") || 
                   element.attr("data-video-url") || 
                   element.attr("data-src") || "";
        if (video_url) {
          if (!video_url.startsWith("http")) {
            video_url = `${BASE_URL}${video_url}`;
          }
          break;
        }
      }
    }
    
    // Extract Exercise Profile information from the structured data
    const primary_muscles: string[] = [];
    const secondary_muscles: string[] = [];
    let mechanics: "Compound" | "Isolation" | null = null;
    let force_type: string | null = null;
    let experience_level: "Beginner" | "Intermediate" | "Advanced" | null = null;
    
    // Look for Exercise Profile section - try multiple strategies
    // Strategy 1: Look for definition lists (dl/dt/dd) which is common for structured data
    $("dl, .exercise-profile dl, .exercise-details dl").each((_, dlEl) => {
      const $dl = $(dlEl);
      $dl.find("dt").each((_, dtEl) => {
        const label = $(dtEl).text().trim().toLowerCase();
        const $dd = $(dtEl).next("dd");
        if ($dd.length === 0) return;
        const value = $dd.text().trim();
        
        if (label.includes("target muscle") || label.includes("target muscle group")) {
          const muscles = value.split(",").map(m => m.trim()).filter(m => m.length > 0);
          muscles.forEach(m => {
            const cleanMuscle = m.replace(/Exercises?/gi, "").trim();
            if (cleanMuscle && !primary_muscles.includes(cleanMuscle)) {
              primary_muscles.push(cleanMuscle);
            }
          });
        } else if (label.includes("secondary muscle")) {
          const muscles = value.split(",").map(m => m.trim()).filter(m => m.length > 0);
          muscles.forEach(m => {
            const cleanMuscle = m.replace(/Exercises?/gi, "").trim();
            if (cleanMuscle && !secondary_muscles.includes(cleanMuscle)) {
              secondary_muscles.push(cleanMuscle);
            }
          });
        } else if (label.includes("mechanics")) {
          if (value === "Compound" || value === "Isolation") {
            mechanics = value;
          }
        } else if (label.includes("force type")) {
          force_type = value;
        } else if (label.includes("experience level")) {
          if (value === "Beginner" || value === "Intermediate" || value === "Advanced") {
            experience_level = value;
          }
        }
      });
    });
    
    // Strategy 2: Look for structured divs with labels and values
    $(".exercise-profile, .exercise-details, .exercise-info, [class*='profile']").each((_, profileSection) => {
      const $section = $(profileSection);
      
      // Look for label-value pairs
      $section.find("dt, .label, .field-label, [class*='label'], strong").each((_, labelEl) => {
        const $label = $(labelEl);
        const label = $label.text().trim().toLowerCase();
        
        // Get the value - could be next sibling, parent's next sibling, or in a span/div
        let value = "";
        const $next = $label.next();
        if ($next.length && ($next.is("dd") || $next.is("span") || $next.is("div"))) {
          value = $next.text().trim();
        } else {
          // Try parent's next sibling
          const $parentNext = $label.parent().next();
          if ($parentNext.length) {
            value = $parentNext.text().trim();
          } else {
            // Try finding value in same parent
            value = $label.parent().text().replace($label.text(), "").trim();
          }
        }
        
        if (!value) return;
        
        if (label.includes("target muscle") || label.includes("target muscle group")) {
          const muscles = value.split(",").map(m => m.trim()).filter(m => m.length > 0);
          muscles.forEach(m => {
            const cleanMuscle = m.replace(/Exercises?/gi, "").trim();
            if (cleanMuscle && !primary_muscles.includes(cleanMuscle)) {
              primary_muscles.push(cleanMuscle);
            }
          });
        } else if (label.includes("secondary muscle")) {
          const muscles = value.split(",").map(m => m.trim()).filter(m => m.length > 0);
          muscles.forEach(m => {
            const cleanMuscle = m.replace(/Exercises?/gi, "").trim();
            if (cleanMuscle && !secondary_muscles.includes(cleanMuscle)) {
              secondary_muscles.push(cleanMuscle);
            }
          });
        } else if (label.includes("mechanics")) {
          if (value === "Compound" || value === "Isolation") {
            mechanics = value;
          }
        } else if (label.includes("force type") || label.includes("force")) {
          force_type = value;
        } else if (label.includes("experience level") || label.includes("experience")) {
          if (value === "Beginner" || value === "Intermediate" || value === "Advanced") {
            experience_level = value;
          }
        }
      });
    });
    
    // Don't use fallback links - only use Exercise Profile data
    // This prevents incorrect categorization from navigation links
    
    // Clean up muscle names - remove "Exercises" suffix and normalize
    const cleanMuscleName = (name: string): string => {
      return name
        .replace(/Exercises?/gi, "")
        .replace(/Muscles?/gi, "")
        .trim()
        .replace(/\s+/g, " ");
    };
    
    const cleanedPrimary = primary_muscles.map(cleanMuscleName).filter(m => m.length > 0);
    const cleanedSecondary = secondary_muscles.map(cleanMuscleName).filter(m => m.length > 0);
    
    // Update arrays with cleaned names
    primary_muscles.length = 0;
    primary_muscles.push(...cleanedPrimary);
    secondary_muscles.length = 0;
    secondary_muscles.push(...cleanedSecondary);
    
    // Legacy: combine all muscles (use cleaned versions)
    const muscle_groups = [...cleanedPrimary];
    
    // Extract category from URL first (most reliable)
    let category = "full-body";
    const urlLower = url.toLowerCase();
    
    // Check URL for category keywords
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (urlLower.includes(`/exercises/${key}`) || urlLower.includes(`-${key}-`)) {
        category = value;
        break;
      }
    }
    
    // If still full-body, check muscle groups for better categorization
    if (category === "full-body" && muscle_groups.length > 0) {
      const upperBodyCount = muscle_groups.filter(m => {
        const mLower = m.toLowerCase();
        return mLower.includes("chest") || mLower.includes("back") || 
               mLower.includes("shoulder") || mLower.includes("bicep") || 
               mLower.includes("tricep") || mLower.includes("forearm") ||
               mLower.includes("lat") || mLower.includes("trap") ||
               mLower.includes("pec") || mLower.includes("deltoid");
      }).length;
      
      const lowerBodyCount = muscle_groups.filter(m => {
        const mLower = m.toLowerCase();
        return mLower.includes("quad") || mLower.includes("hamstring") || 
               mLower.includes("glute") || mLower.includes("calve") ||
               mLower.includes("leg") || mLower.includes("thigh") ||
               mLower.includes("hip");
      }).length;
      
      const coreCount = muscle_groups.filter(m => {
        const mLower = m.toLowerCase();
        return mLower.includes("ab") || mLower.includes("oblique") || 
               mLower.includes("core") || mLower.includes("lower back");
      }).length;
      
      // Categorize based on primary muscle groups
      if (upperBodyCount > 0 && lowerBodyCount === 0 && coreCount === 0) {
        category = "upper-body";
      } else if (lowerBodyCount > 0 && upperBodyCount === 0 && coreCount === 0) {
        category = "lower-body";
      } else if (coreCount > 0 && upperBodyCount === 0 && lowerBodyCount === 0) {
        category = "core";
      } else if (upperBodyCount > 0 && lowerBodyCount > 0) {
        category = "full-body"; // Truly full body
      } else if (upperBodyCount >= lowerBodyCount && upperBodyCount >= coreCount) {
        category = "upper-body"; // Predominantly upper body
      } else if (lowerBodyCount > upperBodyCount && lowerBodyCount > coreCount) {
        category = "lower-body"; // Predominantly lower body
      } else if (coreCount > 0) {
        category = "core";
      }
    }
    
    // Also check page content as fallback
    if (category === "full-body") {
      $(".breadcrumb a, .category a, .tag, [data-category]").each((_, el) => {
        const cat = $(el).text().toLowerCase().trim();
        if (CATEGORY_MAP[cat]) {
          category = CATEGORY_MAP[cat];
          return false;
        }
      });
    }
    
    // Extract equipment
    const equipment: string[] = [];
    $(".equipment a, [data-equipment], .equipment-needed a").each((_, el) => {
      const eq = $(el).text().trim();
      if (eq && !equipment.includes(eq)) equipment.push(eq);
    });
    
    // Extract instructions/steps
    const instructions: string[] = [];
    $(".instructions li, .steps li, .how-to li, ol li").each((_, el) => {
      const step = $(el).text().trim();
      if (step && step.length > 10 && !instructions.includes(step)) {
        instructions.push(step);
      }
    });
    
    // Extract tips
    const tips: string[] = [];
    $(".tips li, .tips p, .tip, .pro-tip").each((_, el) => {
      const tip = $(el).text().trim();
      if (tip && tip.length > 10 && !tips.includes(tip)) {
        tips.push(tip);
      }
    });
    
    // Extract common mistakes
    const common_mistakes: string[] = [];
    $(".common-mistakes li, .mistakes li, .avoid li").each((_, el) => {
      const mistake = $(el).text().trim();
      if (mistake && !common_mistakes.includes(mistake)) {
        common_mistakes.push(mistake);
      }
    });
    
    // Generate key points from instructions or tips
    const key_points = instructions.slice(0, 5).length > 0 
      ? instructions.slice(0, 5)
      : tips.slice(0, 3);
    
    // Determine exercise_type from mechanics or name patterns
    let exercise_type: "compound" | "isolation" | "cardio" | "flexibility" | null = null;
    if (mechanics === "Compound") {
      exercise_type = "compound";
    } else if (mechanics === "Isolation") {
      exercise_type = "isolation";
    } else {
      // Infer from name or category
      const nameLower = name.toLowerCase();
      if (nameLower.includes("run") || nameLower.includes("cardio") || category === "cardio") {
        exercise_type = "cardio";
      } else if (nameLower.includes("stretch") || nameLower.includes("flexibility")) {
        exercise_type = "flexibility";
      } else if (primary_muscles.length > 1 || secondary_muscles.length > 0) {
        exercise_type = "compound";
      } else {
        exercise_type = "isolation";
      }
    }
    
    return {
      exercise_id,
      name: name.trim(),
      category: category as any,
      description: description || `Learn how to perform ${name} correctly with proper form and technique.`,
      video_url,
      muscle_groups: muscle_groups.length > 0 ? muscle_groups : ["Full Body"],
      primary_muscles,
      secondary_muscles,
      exercise_type,
      mechanics,
      force_type,
      experience_level,
      equipment: equipment.length > 0 ? equipment : ["Bodyweight"],
      instructions: instructions.length > 0 ? instructions : [`Perform ${name} with proper form.`],
      tips: tips.slice(0, 5),
      common_mistakes: common_mistakes.slice(0, 5),
      key_points: key_points.length > 0 ? key_points : [`Focus on proper form`, `Control the movement`, `Breathe correctly`],
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function main() {
  console.log("🏋️  Starting comprehensive exercise scraper...\n");
  
  // Get list of exercise URLs
  const exerciseUrls = await scrapeExerciseList();
  
  if (exerciseUrls.length === 0) {
    console.error("❌ No exercises found. Check the website structure.");
    return;
  }
  
  console.log(`\n📋 Found ${exerciseUrls.length} exercises to scrape\n`);
  
  const exercises: ExerciseData[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  const startTime = Date.now();
  
  // Scrape each exercise with rate limiting
  for (let i = 0; i < exerciseUrls.length; i++) {
    const url = exerciseUrls[i];
    const progress = `[${i + 1}/${exerciseUrls.length}]`;
    const percentage = ((i + 1) / exerciseUrls.length * 100).toFixed(1);
    
    process.stdout.write(`\r${progress} (${percentage}%) Scraping: ${url.substring(0, 60)}...`);
    
    try {
      const exercise = await scrapeExercisePage(url);
      
      if (exercise) {
        exercises.push(exercise);
        successCount++;
      } else {
        errors.push(url);
        errorCount++;
      }
    } catch (error) {
      errors.push(url);
      errorCount++;
      console.error(`\n⚠️  Error at ${url}:`, error instanceof Error ? error.message : error);
    }
    
    // Rate limiting: wait 300ms between requests (faster but still respectful)
    if (i < exerciseUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Save progress every 100 exercises
    if ((i + 1) % 100 === 0 || i === exerciseUrls.length - 1) {
      const outputDir = path.join(process.cwd(), "scripts", "data");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(outputDir, "exercises.json"),
        JSON.stringify(exercises, null, 2)
      );
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n💾 Progress saved: ${exercises.length} exercises (${elapsed}s elapsed)`);
    }
  }
  
  // Save final results
  const outputDir = path.join(process.cwd(), "scripts", "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, "exercises.json"),
    JSON.stringify(exercises, null, 2)
  );
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgTime = (parseFloat(totalTime) / exerciseUrls.length).toFixed(2);
  
  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`✅ Scraping complete!`);
  console.log(`${"=".repeat(60)}`);
  console.log(`   ✓ Successfully scraped: ${successCount} exercises`);
  console.log(`   ✗ Errors: ${errorCount}`);
  console.log(`   ⏱  Total time: ${totalTime}s`);
  console.log(`   📊 Average: ${avgTime}s per exercise`);
  console.log(`   📁 Output: scripts/data/exercises.json`);
  console.log(`${"=".repeat(60)}\n`);
  
  if (errors.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, "errors.json"),
      JSON.stringify(errors, null, 2)
    );
    console.log(`⚠️  ${errors.length} errors saved to scripts/data/errors.json`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { scrapeExercisePage, scrapeExerciseList };

