/**
 * Process Reference Videos from CSV
 * 
 * This script:
 * 1. Reads barbell_exercises.csv
 * 2. For each video URL, processes it with MediaPipe pose estimation
 * 3. Stores reference_videos and pose_keyframes in Supabase
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import puppeteer, { Browser, Page } from "puppeteer";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials!");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CSVExercise {
  exerciseName: string;
  videoLink: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
}

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): CSVExercise[] {
  const csvText = fs.readFileSync(filePath, "utf-8");
  const lines = csvText.trim().split("\n");
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const exerciseIdx = headers.findIndex((h) => h.toLowerCase().includes("exercise"));
  const videoIdx = headers.findIndex((h) => h.toLowerCase().includes("video"));
  const primaryIdx = headers.findIndex((h) => h.toLowerCase().includes("primary"));
  const secondaryIndices: number[] = [];
  headers.forEach((h, idx) => {
    if (h.toLowerCase().includes("secondary")) {
      secondaryIndices.push(idx);
    }
  });

  const exercises: CSVExercise[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length <= exerciseIdx) continue;

    const exerciseName = values[exerciseIdx]?.replace(/^"|"$/g, "") || "";
    const videoLink = videoIdx >= 0 ? values[videoIdx]?.replace(/^"|"$/g, "") || "" : "";
    const primaryMuscle = primaryIdx >= 0 ? values[primaryIdx]?.replace(/^"|"$/g, "") || "" : "";
    const secondaryMuscles: string[] = [];
    secondaryIndices.forEach((idx) => {
      if (idx < values.length) {
        const muscle = values[idx]?.replace(/^"|"$/g, "").trim() || "";
        if (muscle) secondaryMuscles.push(muscle);
      }
    });

    if (exerciseName && videoLink) {
      exercises.push({
        exerciseName,
        videoLink,
        primaryMuscle,
        secondaryMuscles,
      });
    }
  }

  return exercises;
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

/**
 * Download YouTube video to temporary file with retry logic
 */
async function downloadYouTubeVideo(videoUrl: string, outputPath: string, retries: number = 3): Promise<{ duration: number }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  📥 Downloading video... (attempt ${attempt}/${retries})`);
      
      // Get video info first to get duration
      const info = await ytdl.getInfo(videoUrl);
      const duration = parseInt(info.videoDetails.lengthSeconds || "0");
      
      if (duration === 0) {
        throw new Error("Could not determine video duration");
      }
      
      // Download video
      return new Promise((resolve, reject) => {
        const videoStream = ytdl(videoUrl, {
          quality: "lowest", // Use lowest quality for faster processing
          filter: "videoandaudio",
        });

        const writeStream = fs.createWriteStream(outputPath);
        videoStream.pipe(writeStream);

        writeStream.on("finish", () => {
          console.log(`  ✓ Video downloaded (${duration}s)`);
          resolve({ duration });
        });

        writeStream.on("error", (error) => {
          reject(new Error(`Download failed: ${error.message}`));
        });

        videoStream.on("error", (error) => {
          reject(new Error(`YouTube stream error: ${error.message}`));
        });
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${errorMessage}`);
      }
      console.log(`  ⚠️  Attempt ${attempt} failed, retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error("Failed to download video");
}

/**
 * Extract frames from video at specified intervals
 */
async function extractFrames(
  videoPath: string,
  outputDir: string,
  interval: number = 200 // milliseconds
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    console.log(`  🎞️  Extracting frames (every ${interval}ms)...`);

    // Try to set FFmpeg path if provided via environment variable
    const ffmpegPath = process.env.FFMPEG_PATH;
    if (ffmpegPath) {
      if (!fs.existsSync(ffmpegPath)) {
        reject(new Error(`FFMPEG_PATH points to non-existent file: ${ffmpegPath}`));
        return;
      }
      ffmpeg.setFfmpegPath(ffmpegPath);
      const ffprobePath = path.join(path.dirname(ffmpegPath), "ffprobe.exe");
      if (fs.existsSync(ffprobePath)) {
        ffmpeg.setFfprobePath(ffprobePath);
      } else {
        console.warn(`⚠️  Warning: ffprobe.exe not found at ${ffprobePath}`);
      }
    } else {
      console.log(`  💡 Tip: Set FFMPEG_PATH in .env.local to specify FFmpeg location`);
      console.log(`     Example: FFMPEG_PATH=C:\\path\\to\\ffmpeg\\bin\\ffmpeg.exe`);
    }

    // Get video duration first
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        const errorMsg = err.message.includes("Cannot find ffprobe") 
          ? `FFmpeg not found. Please either:\n  1. Add FFmpeg to your system PATH and restart PowerShell, OR\n  2. Add FFMPEG_PATH=C:\\path\\to\\ffmpeg\\bin\\ffmpeg.exe to your .env.local file`
          : err.message;
        reject(new Error(`Failed to probe video: ${errorMsg}`));
        return;
      }

      const duration = metadata.format.duration || 0;
      const frameInterval = interval / 1000; // Convert to seconds
      const totalFrames = Math.ceil(duration / frameInterval);
      const framePaths: string[] = [];

      // Extract all frames at once using FFmpeg's frame extraction
      // This is more efficient than extracting one by one
      const outputPattern = path.join(outputDir, "frame_%06d.jpg");
      
      let frameCount = 0;
      let lastProgress = 0;

      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=1/${frameInterval}`, // Extract frames at specified interval
          "-q:v 2", // High quality JPEG
        ])
        .output(outputPattern)
        .on("start", (commandLine) => {
          console.log(`  🔧 FFmpeg command: ${commandLine}`);
        })
        .on("progress", (progress) => {
          if (progress.percent && progress.percent > lastProgress + 10) {
            console.log(`  📊 Extraction progress: ${Math.floor(progress.percent)}%`);
            lastProgress = progress.percent;
          }
        })
        .on("end", () => {
          // Collect all extracted frame paths
          for (let i = 1; i <= totalFrames; i++) {
            const framePath = path.join(outputDir, `frame_${i.toString().padStart(6, "0")}.jpg`);
            if (fs.existsSync(framePath)) {
              framePaths.push(framePath);
            }
          }
          console.log(`  ✓ Extracted ${framePaths.length} frames`);
          resolve(framePaths);
        })
        .on("error", (err) => {
          reject(new Error(`Failed to extract frames: ${err.message}. Make sure FFmpeg is installed and accessible.`));
        })
        .run();
    });
  });
}

/**
 * Process video frames with MediaPipe using Puppeteer
 */
async function processFramesWithMediaPipe(
  framePaths: string[],
  browser: Browser,
  interval: number
): Promise<Array<{
  frameNumber: number;
  timestampMs: number;
  poseData: any;
  confidence: number;
}>> {
  console.log(`  🤖 Processing ${framePaths.length} frames with MediaPipe...`);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:266',message:'processFramesWithMediaPipe entry',data:{frameCount:framePaths.length,interval},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
  // #endregion

  const page = await browser.newPage();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:270',message:'Puppeteer page created',data:{url:page.url()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const keyframes: Array<{
    frameNumber: number;
    timestampMs: number;
    poseData: any;
    confidence: number;
  }> = [];

  try {
    // Listen to console messages for debugging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:278',message:'Browser console message',data:{type,text:text.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,D'})}).catch(()=>{});
      // #endregion
      if (type === 'error') {
        console.error(`  🔴 Browser console error: ${text}`);
      } else if (type === 'warn') {
        console.warn(`  ⚠️ Browser console warning: ${text}`);
      } else {
        console.log(`  📝 Browser console: ${text}`);
      }
    });

    // Listen to page errors
    page.on('pageerror', (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:291',message:'Page error event',data:{errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error(`  🔴 Page error: ${errorMessage}`);
    });

    // Create HTML page with MediaPipe
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
      </head>
      <body>
        <img id="frame" style="display: none;" crossorigin="anonymous" />
        <script type="module">
          let poseLandmarker = null;
          let initialized = false;
          let initError = null;
          
          (async () => {
            window.initStartTime = Date.now();
            window.initLogs = [];
            try {
              console.log('Starting MediaPipe initialization...');
              console.log('Loading MediaPipe module...');
              window.initLogs.push({step:'module_import_start',time:Date.now()});
              const Vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm');
              window.initLogs.push({step:'module_import_complete',time:Date.now(),hasVision:typeof Vision.PoseLandmarker!=='undefined'});
              const { PoseLandmarker, FilesetResolver } = Vision;
              
              console.log('Loading WASM files...');
              window.wasmStartTime = Date.now();
              window.initLogs.push({step:'wasm_start',time:Date.now()});
              const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
              );
              window.initLogs.push({step:'wasm_complete',time:Date.now(),elapsed:Date.now()-window.wasmStartTime});
              
              console.log('Creating PoseLandmarker...');
              window.modelStartTime = Date.now();
              window.initLogs.push({step:'model_start',time:Date.now()});
              poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
                  delegate: "CPU"
                },
                runningMode: "IMAGE",
                numPoses: 1
              });
              window.initLogs.push({step:'model_complete',time:Date.now(),elapsed:Date.now()-window.modelStartTime,totalElapsed:Date.now()-window.initStartTime});

              console.log('MediaPipe initialized successfully!');
              window.poseLandmarker = poseLandmarker;
              window.initialized = true;
              window.initLogs.push({step:'init_complete',time:Date.now(),totalElapsed:Date.now()-window.initStartTime});
            } catch (error) {
              window.initLogs.push({step:'init_error',time:Date.now(),error:String(error).substring(0,200),elapsed:Date.now()-window.initStartTime});
              console.error('MediaPipe initialization error:', error);
              window.poseLandmarker = null;
              window.initError = error.toString();
              window.initialized = false;
            }
          })();
        </script>
      </body>
      </html>
    `;

    console.log(`  ⏳ Loading MediaPipe (this may take 30-60 seconds)...`);
    const setContentStartTime = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:345',message:'Before setContent',data:{htmlLength:htmlContent.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    await page.setContent(htmlContent);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:348',message:'After setContent',data:{elapsed:Date.now()-setContentStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Wait for initialization with longer timeout and better error checking
    const waitStartTime = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:351',message:'Before waitForFunction',data:{timeout:120000},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Check initial state before waiting and log browser-side timing
    const initialState = await page.evaluate(() => ({
      initialized: (globalThis as any).initialized,
      initError: (globalThis as any).initError,
      hasVision: typeof (globalThis as any).Vision !== 'undefined',
      initLogs: (globalThis as any).initLogs || []
    }));
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:360',message:'Initial state check',data:initialState,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'})}).catch(()=>{});
    // #endregion
    
    // Periodically check progress while waiting
    const progressInterval = setInterval(async () => {
      const progress = await page.evaluate(() => ({
        initialized: (globalThis as any).initialized,
        initError: (globalThis as any).initError,
        initLogs: (globalThis as any).initLogs || [],
        elapsed: Date.now() - ((globalThis as any).initStartTime || Date.now())
      }));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:368',message:'Progress check',data:progress,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,E'})}).catch(()=>{});
      // #endregion
    }, 5000); // Check every 5 seconds
    
    try {
      await page.waitForFunction(() => {
        const init = (globalThis as any).initialized;
        const error = (globalThis as any).initError;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:365',message:'waitForFunction check',data:{init,error:error?String(error).substring(0,100):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        if (error) {
          throw new Error(`Initialization failed: ${error}`);
        }
        return init === true;
      }, { timeout: 120000, polling: 1000 }); // Increased to 2 minutes, poll every second
      clearInterval(progressInterval);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:373',message:'waitForFunction success',data:{elapsed:Date.now()-waitStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.log(`  ✅ MediaPipe initialized successfully`);
    } catch (timeoutError: any) {
      clearInterval(progressInterval);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:376',message:'waitForFunction timeout/error',data:{elapsed:Date.now()-waitStartTime,error:timeoutError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D,E'})}).catch(()=>{});
      // #endregion
      // Check if there was an initialization error
      const finalState = await page.evaluate(() => ({
        initialized: (globalThis as any).initialized,
        initError: (globalThis as any).initError,
        hasVision: typeof (globalThis as any).Vision !== 'undefined',
        initLogs: (globalThis as any).initLogs || [],
        totalElapsed: Date.now() - ((globalThis as any).initStartTime || Date.now())
      }));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:383',message:'Final state after timeout',data:finalState,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,D'})}).catch(()=>{});
      // #endregion
      if (finalState.initError) {
        throw new Error(`MediaPipe initialization failed: ${finalState.initError}`);
      }
      throw new Error(`MediaPipe initialization timeout: ${timeoutError.message}`);
    }

    // Process each frame
    const frameProcessingStartTime = Date.now();
    for (let i = 0; i < framePaths.length; i++) {
      const frameStartTime = Date.now();
      const framePath = framePaths[i];
      const frameData = fs.readFileSync(framePath);
      const base64 = frameData.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      // Load frame and detect pose
      const poseResult = await page.evaluate(
        async (imageDataUrl: string, timestamp: number) => {
          const img = (globalThis as any).document.getElementById("frame") as any;
          const poseLandmarker = (globalThis as any).poseLandmarker;

          if (!poseLandmarker) {
            return null;
          }

          return new Promise<{
            landmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
            confidence: number;
          } | null>((resolve) => {
            img.onload = async () => {
              try {
                const result = poseLandmarker.detect(img);

                if (result && result.landmarks && result.landmarks.length > 0) {
                  const landmarks = result.landmarks[0];
                  const confidence =
                    landmarks.reduce((sum: number, lm: any) => sum + (lm.visibility || 0), 0) /
                    landmarks.length;

                  resolve({
                    landmarks: landmarks.map((lm: any) => ({
                      x: lm.x,
                      y: lm.y,
                      z: lm.z || 0,
                      visibility: lm.visibility || 0,
                    })),
                    confidence,
                  });
                } else {
                  resolve(null);
                }
              } catch (error) {
                console.error("Pose detection error:", error);
                resolve(null);
              }
            };

            img.src = imageDataUrl;
          });
        },
        dataUrl,
        i * interval
      ) as { landmarks: Array<{ x: number; y: number; z: number; visibility: number }>; confidence: number } | null;

      if (poseResult && poseResult.landmarks) {
        keyframes.push({
          frameNumber: i,
          timestampMs: i * interval,
          poseData: {
            landmarks: poseResult.landmarks,
          },
          confidence: poseResult.confidence,
        });
      }

      // Progress update with timing
      const frameElapsed = Date.now() - frameStartTime;
      const totalElapsed = Date.now() - frameProcessingStartTime;
      const avgTimePerFrame = totalElapsed / (i + 1);
      const estimatedRemaining = Math.round((framePaths.length - i - 1) * avgTimePerFrame / 1000);
      
      if ((i + 1) % 10 === 0 || i === framePaths.length - 1) {
        const progress = (((i + 1) / framePaths.length) * 100).toFixed(1);
        console.log(`  📊 Progress: ${progress}% (${i + 1}/${framePaths.length} frames) | Avg: ${avgTimePerFrame.toFixed(0)}ms/frame | Est. remaining: ${estimatedRemaining}s`);
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4447cb03-7103-47f3-9754-fd8b1a3f937d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'process-reference-videos.ts:452',message:'Frame processed',data:{frameNumber:i+1,totalFrames:framePaths.length,frameElapsed,avgTimePerFrame,estimatedRemaining},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }

    await page.close();
    console.log(`  ✅ Processed ${keyframes.length} pose keyframes`);
    return keyframes;
  } catch (error) {
    await page.close();
    throw error;
  }
}

/**
 * Process video with pose estimation
 * Downloads YouTube video, extracts frames, and processes with MediaPipe
 */
async function processVideoWithPoseEstimation(
  videoUrl: string,
  exerciseName: string,
  browser: Browser,
  interval: number = 200 // Extract pose every 200ms
): Promise<{
  durationSeconds: number;
  frameCount: number;
  keyframes: Array<{
    frameNumber: number;
    timestampMs: number;
    poseData: any;
    confidence: number;
  }>;
}> {
  console.log(`  🎥 Processing video: ${videoUrl}`);

  const youtubeId = extractYouTubeId(videoUrl);
  if (!youtubeId) {
    throw new Error("Invalid YouTube URL");
  }

  // Create temporary directories
  const tempDir = path.join(process.cwd(), "temp", `video_${youtubeId}`);
  const framesDir = path.join(tempDir, "frames");
  const videoPath = path.join(tempDir, "video.mp4");

  // Ensure directories exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  try {
    // Step 1: Download YouTube video
    const { duration } = await downloadYouTubeVideo(videoUrl, videoPath);

    // Step 2: Extract frames
    const framePaths = await extractFrames(videoPath, framesDir, interval);

    // Step 3: Process frames with MediaPipe
    const keyframes = await processFramesWithMediaPipe(framePaths, browser, interval);

    // Cleanup temporary files
    console.log(`  🧹 Cleaning up temporary files...`);
    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      durationSeconds: Math.floor(duration),
      frameCount: keyframes.length,
      keyframes,
    };
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * Get or create exercise in database
 */
async function getOrCreateExercise(
  exerciseName: string,
  primaryMuscle: string,
  secondaryMuscles: string[]
): Promise<string> {
  // Generate exercise_id from name
  const exerciseId = `csv-${exerciseName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  // Check if exercise exists
  const { data: existing } = await supabase
    .from("exercises")
    .select("exercise_id")
    .eq("exercise_id", exerciseId)
    .single();

  if (existing) {
    console.log(`  ✓ Exercise already exists: ${exerciseName}`);
    return exerciseId;
  }

  // Determine category
  let category = "full-body";
  const primaryLower = primaryMuscle.toLowerCase();
  if (
    primaryLower.includes("chest") ||
    primaryLower.includes("shoulder") ||
    primaryLower.includes("deltoid") ||
    primaryLower.includes("arm") ||
    primaryLower.includes("bicep") ||
    primaryLower.includes("tricep") ||
    primaryLower.includes("trap")
  ) {
    category = "upper-body";
  } else if (
    primaryLower.includes("leg") ||
    primaryLower.includes("quad") ||
    primaryLower.includes("hamstring") ||
    primaryLower.includes("glute") ||
    primaryLower.includes("calf") ||
    primaryLower.includes("adductor")
  ) {
    category = "lower-body";
  } else if (primaryLower.includes("core") || primaryLower.includes("ab") || primaryLower.includes("spinal")) {
    category = "core";
  }

  // Create exercise
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      exercise_id: exerciseId,
      name: exerciseName,
      category,
      description: `${exerciseName} targeting ${primaryMuscle}.`,
      muscle_groups: [primaryMuscle, ...secondaryMuscles],
      primary_muscles: [primaryMuscle],
      secondary_muscles: secondaryMuscles,
      exercise_type: secondaryMuscles.length > 0 ? "compound" : "isolation",
      mechanics: secondaryMuscles.length > 0 ? "Compound" : "Isolation",
      equipment: ["Barbell"],
      common_mistakes: [],
      key_points: [],
    })
    .select("exercise_id")
    .single();

  if (error) {
    console.error(`  ❌ Error creating exercise:`, error);
    throw error;
  }

  console.log(`  ✓ Created exercise: ${exerciseName}`);
  return data.exercise_id;
}

/**
 * Create reference video entry
 */
async function createReferenceVideo(
  exerciseId: string,
  exerciseName: string,
  videoUrl: string,
  durationSeconds: number,
  frameCount: number
): Promise<string> {
  // Check if video already exists
  const { data: existing } = await supabase
    .from("reference_videos")
    .select("id")
    .eq("video_url", videoUrl)
    .eq("exercise_id", exerciseId)
    .single();

  if (existing) {
    console.log(`  ✓ Reference video already exists for: ${exerciseName}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("reference_videos")
    .insert({
      exercise_id: exerciseId,
      title: `${exerciseName} - Reference Video`,
      video_url: videoUrl,
      duration_seconds: durationSeconds,
      frame_count: frameCount,
      quality: "high",
      is_verified: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  ❌ Error creating reference video:`, error);
    throw error;
  }

  console.log(`  ✓ Created reference video entry`);
  return data.id;
}

/**
 * Store pose keyframes
 */
async function storePoseKeyframes(
  referenceVideoId: string,
  keyframes: Array<{
    frameNumber: number;
    timestampMs: number;
    poseData: any;
    confidence: number;
  }>
): Promise<void> {
  if (keyframes.length === 0) {
    console.log(`  ⚠️  No keyframes to store`);
    return;
  }

  // Insert keyframes in batches
  const batchSize = 100;
  for (let i = 0; i < keyframes.length; i += batchSize) {
    const batch = keyframes.slice(i, i + batchSize);
    const inserts = batch.map((kf) => ({
      reference_video_id: referenceVideoId,
      frame_number: kf.frameNumber,
      timestamp_ms: kf.timestampMs,
      pose_data: kf.poseData,
      confidence: kf.confidence,
    }));

    const { error } = await supabase.from("pose_keyframes").insert(inserts);

    if (error) {
      console.error(`  ❌ Error storing keyframes batch ${i / batchSize + 1}:`, error);
      throw error;
    }
  }

  console.log(`  ✓ Stored ${keyframes.length} pose keyframes`);
}

/**
 * Main processing function
 */
async function main() {
  console.log("🚀 Starting reference video processing...\n");

  const csvPath = path.join(process.cwd(), "public", "data", "barbell_exercises.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const exercises = parseCSV(csvPath);
  console.log(`📋 Found ${exercises.length} exercises to process\n`);

  // Launch Puppeteer browser
  console.log("🌐 Launching browser for video processing...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    for (const exercise of exercises) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Processing: ${exercise.exerciseName}`);
      console.log(`Video: ${exercise.videoLink}`);
      console.log(`${"=".repeat(60)}`);

      try {
        // Get or create exercise
        const exerciseId = await getOrCreateExercise(
          exercise.exerciseName,
          exercise.primaryMuscle,
          exercise.secondaryMuscles
        );

        // Process video with pose estimation
        const videoData = await processVideoWithPoseEstimation(
          exercise.videoLink,
          exercise.exerciseName,
          browser
        );

        // Create reference video entry
        const referenceVideoId = await createReferenceVideo(
          exerciseId,
          exercise.exerciseName,
          exercise.videoLink,
          videoData.durationSeconds,
          videoData.frameCount
        );

        // Store pose keyframes
        if (videoData.keyframes.length > 0) {
          await storePoseKeyframes(referenceVideoId, videoData.keyframes);
          processed++;
          console.log(`  ✅ Successfully processed and stored ${videoData.keyframes.length} keyframes`);
        } else {
          skipped++;
          console.log(`  ⚠️  No pose keyframes extracted (video may be too short or processing failed)`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${exercise.exerciseName}:`, error);
        errors++;
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`✅ Processing complete!`);
  console.log(`${"=".repeat(60)}`);
  console.log(`   ✓ Processed: ${processed}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n💡 Note: Make sure FFmpeg is installed on your system`);
  console.log(`   Windows: Download from https://ffmpeg.org/download.html`);
  console.log(`   macOS: brew install ffmpeg`);
  console.log(`   Linux: sudo apt-get install ffmpeg`);
}

if (require.main === module) {
  main().catch(console.error);
}

