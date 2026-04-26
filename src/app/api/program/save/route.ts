/**
 * API Route for Saving Programs to Supabase
 * POST /api/program/save
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GeneratedProgram } from "@/lib/programBuilder/types";

interface SaveRequest {
  name?: unknown;
  program?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Parse request body
    const body = (await request.json()) as SaveRequest;

    // Validate input
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Invalid input", details: "Missing or invalid 'name' field" },
        { status: 400 }
      );
    }

    if (!body.program || typeof body.program !== "object") {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "Missing or invalid 'program' field",
        },
        { status: 400 }
      );
    }

    const program = body.program as GeneratedProgram;
    const name = body.name;

    // Validate program has required fields
    if (!program.profile || !program.workouts) {
      return NextResponse.json(
        {
          error: "Invalid program",
          details: "Program must contain profile and workouts",
        },
        { status: 400 }
      );
    }

    // Insert into user_programs table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("user_programs")
      .insert({
        user_id: userId,
        name: name,
        profile: program.profile,
        program_data: {
          workouts: program.workouts,
          split: program.split,
        },
        llm_explanation: program.explanation || null,
      })
      .select("id")
      .single() as { data: { id: string } | null; error: { code?: string; message: string } | null };

    if (error) {
      console.error("Supabase insert error:", error);

      // Check if it's a table not found error
      if (
        error.code === "42P01" ||
        error.message.includes("relation") ||
        error.message.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error: "Database not ready",
            details:
              "The user_programs table does not exist. Please run migrations: supabase migration up",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to save program",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!data || !data.id) {
      return NextResponse.json(
        {
          error: "Failed to save program",
          details: "No ID returned from database",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Error saving program:", error);
    return NextResponse.json(
      {
        error: "Failed to save program",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
