/**
 * Focused scraper for Machine Exercises from muscleandstrength.com
 * Scrapes page by page, extracting Exercise Profile data correctly
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

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

const BASE_URL = "https://www.muscleandstrength.com";

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

async function scrapeMachineExercisesPage(pageNum: number): Promise<string[]> {
  const url = pageNum === 1 
    ? `${BASE_URL}/exercises/machine`
    : `${BASE_URL}/exercises/machine?page=${pageNum}`;
  
  console.log(`\nFetching page ${pageNum}: ${url}`);
  
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    const exerciseLinks: string[] = [];
    
    // Find all "View Exercise" links
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      // Look for exercise detail pages
      if (href && href.includes('/exercises/') && href.endsWith('.html')) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (!exerciseLinks.includes(fullUrl)) {
          exerciseLinks.push(fullUrl);
        }
      }
    });
    
    console.log(`  Found ${exerciseLinks.length} exercises on page ${pageNum}`);
    return exerciseLinks;
  } catch (error) {
    console.error(`Error fetching page ${pageNum}:`, error);
    return [];
  }
}

async function scrapeExerciseDetail(url: string): Promise<ExerciseData | null> {
  try {
    console.log(`  Scraping: ${url}`);
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    // Extract exercise name from h1 and clean it
    let name = $('h1').first().text().trim();
    // Remove "Video Exercise Guide" and similar suffixes
    name = name
      .replace(/Video Exercise Guide/gi, '')
      .replace(/Exercise Guide/gi, '')
      .replace(/Video Guide/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!name || name.length === 0) {
      console.warn(`    ⚠️  No name found for ${url}`);
      return null;
    }
    
    console.log(`    ✓ ${name}`);
    
    // Generate exercise_id from cleaned name
    const exercise_id = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    // Extract description
    let description = $('meta[name="description"]').attr('content') || '';
    if (!description || description.includes('kept private')) {
      description = `Learn how to perform ${name} with proper form and technique.`;
    }
    
    // Extract video URL
    let video_url = "";
    $('iframe[src*="youtube"], iframe[src*="vimeo"]').each((_, el) => {
      video_url = $(el).attr('src') || "";
      if (video_url && !video_url.startsWith('http')) {
        video_url = `https:${video_url}`;
      }
      return false; // break
    });
    
    // Extract Exercise Profile data
    const primary_muscles: string[] = [];
    const secondary_muscles: string[] = [];
    let mechanics: "Compound" | "Isolation" | null = null;
    let force_type: string | null = null;
    let experience_level: "Beginner" | "Intermediate" | "Advanced" | null = null;
    const equipment: string[] = ["Machine"]; // We know it's machine exercises
    
    // Look for Exercise Profile section - try multiple approaches
    // Approach 1: Look for definition lists (dl/dt/dd)
    $('dl').each((_, dlEl) => {
      $(dlEl).find('dt').each((_, dtEl) => {
        const label = $(dtEl).text().trim().toLowerCase();
        const $dd = $(dtEl).next('dd');
        if (!$dd.length) return;
        
        const value = $dd.text().trim();
        
        if (label.includes('target muscle') || label.includes('primary muscle')) {
          const muscles = value.split(',').map(m => m.trim()).filter(m => m.length > 0);
          muscles.forEach(m => {
            const clean = m.replace(/Exercises?/gi, '').trim();
            if (clean && !primary_muscles.includes(clean)) {
              primary_muscles.push(clean);
            }
          });
        } else if (label.includes('secondary muscle')) {
          const muscles = value.split(',').map(m => m.trim()).filter(m => m.length > 0);
          muscles.forEach(m => {
            const clean = m.replace(/Exercises?/gi, '').trim();
            if (clean && !secondary_muscles.includes(clean)) {
              secondary_muscles.push(clean);
            }
          });
        } else if (label.includes('mechanics')) {
          if (value === 'Compound' || value === 'Isolation') {
            mechanics = value;
          }
        } else if (label.includes('force')) {
          force_type = value;
        } else if (label.includes('experience')) {
          if (value === 'Beginner' || value === 'Intermediate' || value === 'Advanced') {
            experience_level = value;
          }
        }
      });
    });
    
    // Approach 2: Look for divs/sections with Exercise Profile
    $('.exercise-profile, [class*="profile"]').each((_, section) => {
      $(section).find('strong, .label, dt').each((_, labelEl) => {
        const label = $(labelEl).text().trim().toLowerCase();
        let value = '';
        
        // Try to find the value
        const $next = $(labelEl).next();
        if ($next.length) {
          value = $next.text().trim();
        } else {
          value = $(labelEl).parent().text().replace($(labelEl).text(), '').trim();
        }
        
        if (!value) return;
        
        if (label.includes('target muscle')) {
          const muscles = value.split(',').map(m => m.trim());
          muscles.forEach(m => {
            const clean = m.replace(/Exercises?/gi, '').trim();
            if (clean && !primary_muscles.includes(clean)) {
              primary_muscles.push(clean);
            }
          });
        } else if (label.includes('secondary')) {
          const muscles = value.split(',').map(m => m.trim());
          muscles.forEach(m => {
            const clean = m.replace(/Exercises?/gi, '').trim();
            if (clean && !secondary_muscles.includes(clean)) {
              secondary_muscles.push(clean);
            }
          });
        }
      });
    });
    
    // Determine category from primary muscle
    let category = "full-body";
    if (primary_muscles.length > 0) {
      const primaryLower = primary_muscles[0].toLowerCase();
      if (primaryLower.includes('chest') || primaryLower.includes('back') || 
          primaryLower.includes('shoulder') || primaryLower.includes('bicep') || 
          primaryLower.includes('tricep') || primaryLower.includes('forearm')) {
        category = "upper-body";
      } else if (primaryLower.includes('quad') || primaryLower.includes('hamstring') || 
                 primaryLower.includes('glute') || primaryLower.includes('calve') ||
                 primaryLower.includes('leg')) {
        category = "lower-body";
      } else if (primaryLower.includes('ab') || primaryLower.includes('core') || 
                 primaryLower.includes('oblique')) {
        category = "core";
      }
    }
    
    // Extract instructions
    const instructions: string[] = [];
    $('ol li, .instructions li, .steps li').each((_, el) => {
      const step = $(el).text().trim();
      if (step && step.length > 10 && !instructions.includes(step)) {
        instructions.push(step);
      }
    });
    
    // Extract tips
    const tips: string[] = [];
    $('.tips li, .tip').each((_, el) => {
      const tip = $(el).text().trim();
      if (tip && tip.length > 10 && !tips.includes(tip)) {
        tips.push(tip);
      }
    });
    
    // Extract common mistakes
    const common_mistakes: string[] = [];
    $('.common-mistakes li, .mistakes li').each((_, el) => {
      const mistake = $(el).text().trim();
      if (mistake && !common_mistakes.includes(mistake)) {
        common_mistakes.push(mistake);
      }
    });
    
    const key_points = instructions.slice(0, 5);
    
    // Determine exercise type
    let exercise_type: "compound" | "isolation" | "cardio" | "flexibility" | null = null;
    if (mechanics === "Compound") {
      exercise_type = "compound";
    } else if (mechanics === "Isolation") {
      exercise_type = "isolation";
    }
    
    const muscle_groups = [...primary_muscles];
    
    console.log(`      Primary: ${primary_muscles.join(', ') || 'None'}`);
    console.log(`      Secondary: ${secondary_muscles.join(', ') || 'None'}`);
    console.log(`      Mechanics: ${mechanics || 'N/A'}`);
    
    return {
      exercise_id,
      name,
      category: category as any,
      description,
      video_url,
      muscle_groups: muscle_groups.length > 0 ? muscle_groups : ["Machine"],
      primary_muscles,
      secondary_muscles,
      exercise_type,
      mechanics,
      force_type,
      experience_level,
      equipment,
      instructions: instructions.length > 0 ? instructions : [`Perform ${name} with proper form.`],
      tips: tips.slice(0, 5),
      common_mistakes: common_mistakes.slice(0, 5),
      key_points: key_points.length > 0 ? key_points : [`Focus on proper form`, `Control the movement`],
    };
  } catch (error) {
    console.error(`    ❌ Error scraping ${url}:`, error);
    return null;
  }
}

async function main() {
  console.log("🏋️  Starting Machine Exercises Scraper\n");
  console.log("This will scrape all machine exercises from muscleandstrength.com");
  console.log("Following the manual approach: page by page\n");
  
  const dataDir = path.join(process.cwd(), "scripts", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const outputFile = path.join(dataDir, "machine-exercises.json");
  const exercises: ExerciseData[] = [];
  
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    // Get exercise links from current page
    const exerciseLinks = await scrapeMachineExercisesPage(currentPage);
    
    if (exerciseLinks.length === 0) {
      console.log(`\n✓ No more exercises found. Stopping at page ${currentPage - 1}.`);
      hasMorePages = false;
      break;
    }
    
    // Scrape each exercise on this page
    for (let i = 0; i < exerciseLinks.length; i++) {
      const url = exerciseLinks[i];
      console.log(`\n[${i + 1}/${exerciseLinks.length}] on page ${currentPage}`);
      
      const exercise = await scrapeExerciseDetail(url);
      if (exercise) {
        exercises.push(exercise);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Save progress after each page
    fs.writeFileSync(outputFile, JSON.stringify(exercises, null, 2));
    console.log(`\n💾 Saved ${exercises.length} exercises to ${outputFile}`);
    
    currentPage++;
    
    // Safety limit: stop after 20 pages
    if (currentPage > 20) {
      console.log("\n⚠️  Reached safety limit of 20 pages. Stopping.");
      hasMorePages = false;
    }
    
    // Small delay between pages
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Scraping complete!`);
  console.log(`${"=".repeat(60)}`);
  console.log(`   Total exercises scraped: ${exercises.length}`);
  console.log(`   With primary muscles: ${exercises.filter(e => e.primary_muscles.length > 0).length}`);
  console.log(`   Output file: ${outputFile}`);
  console.log(`${"=".repeat(60)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

