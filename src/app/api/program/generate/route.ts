/**
 * API Route for Program Generation with LLM Enhancement
 * POST /api/program/generate
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateProgram } from "@/lib/programBuilder/programAssembler";
import type {
  UserProfile,
  GeneratedProgram,
  ExperienceLevel,
  GymType,
  SplitType,
} from "@/lib/programBuilder/types";

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || "").trim();
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "qwen/qwen3-8b";

// Valid enum values
const VALID_EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "never",
  "beginner",
  "intermediate",
  "advanced",
];
const VALID_GYM_TYPES: GymType[] = ["commercial", "home", "hotel"];
const VALID_SPLIT_TYPES: SplitType[] = [
  "full_body",
  "upper_lower",
  "anterior_posterior",
  "push_pull_legs",
  "upper_lower_ppl",
];

function isValidUserProfile(data: unknown): data is UserProfile {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const profile = data as Record<string, unknown>;

  return (
    VALID_EXPERIENCE_LEVELS.includes(profile.experience as ExperienceLevel) &&
    typeof profile.daysPerWeek === "number" &&
    profile.daysPerWeek >= 2 &&
    profile.daysPerWeek <= 6 &&
    typeof profile.minutesPerSession === "number" &&
    profile.minutesPerSession >= 30 &&
    profile.minutesPerSession <= 90 &&
    VALID_GYM_TYPES.includes(profile.gymType as GymType) &&
    VALID_SPLIT_TYPES.includes(profile.selectedSplit as SplitType)
  );
}

async function callOpenRouterLLM(
  profile: UserProfile,
  program: GeneratedProgram
): Promise<string | null> {
  try {
    if (!OPENROUTER_API_KEY) {
      console.warn(
        "OpenRouter API key not configured, skipping LLM enhancement"
      );
      return null;
    }

    // Build workout summary
    const workoutSummary = program.workouts
      .map((day) => {
        const exerciseNames = day.exercises
          .map((ex) => `${ex.selectedExercise.name} (${ex.sets}x${ex.repRange[0]}-${ex.repRange[1]})`)
          .join(", ");
        return `${day.dayName}: ${exerciseNames || "Rest day"}`;
      })
      .join("\n");

    // Build user message
    let userMessage = `I generated a hypertrophy program for a user with this profile:
${JSON.stringify(profile, null, 2)}

The program has these workouts:
${workoutSummary}`;

    if (profile.weakPoints && profile.weakPoints.length > 0) {
      userMessage += `\n\nThe user's weak points are: ${profile.weakPoints.join(", ")}
Review if any exercises should be swapped to better target these weak areas. Only suggest swaps from the exercise alternatives available.`;
    }

    userMessage += `\n\nRespond in JSON format:
{
  "explanation": "2-3 sentence explanation of why this program is structured this way",
  "swaps": []
}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "FixMyForm",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a hypertrophy training specialist who follows evidence-based principles. Volume guidelines: beginners 6-12 sets/muscle/week, intermediate 5-10, advanced 3-9.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 512,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "OpenRouter API error:",
        response.status,
        errorText.substring(0, 200)
      );
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const responseText = data.choices?.[0]?.message?.content || "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { explanation?: string };
      return parsed.explanation || null;
    }

    return null;
  } catch (error) {
    console.error("Error calling OpenRouter LLM:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = (await request.json()) as unknown;

    // Validate input
    if (!isValidUserProfile(body)) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details:
            "Missing or invalid required fields: experience, daysPerWeek, minutesPerSession, gymType, selectedSplit",
        },
        { status: 400 }
      );
    }

    const profile: UserProfile = body;

    // Generate program using rules engine
    const program = generateProgram(profile);

    // Try to enhance with LLM explanation (graceful degradation if fails)
    const explanation = await callOpenRouterLLM(profile, program);
    if (explanation) {
      program.explanation = explanation;
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Error generating program:", error);
    return NextResponse.json(
      {
        error: "Failed to generate program",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
