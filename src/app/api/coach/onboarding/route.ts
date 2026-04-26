import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TrainingBackground } from "@/lib/agent/types";

/** Validate that the payload looks like a TrainingBackground. */
function validatePayload(body: unknown): body is TrainingBackground {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  const validLevels = ["never", "beginner", "intermediate", "advanced"];
  if (!validLevels.includes(b.experienceLevel as string)) return false;
  if (typeof b.experienceYears !== "number" || b.experienceYears < 0) return false;
  if (b.primaryGoals !== undefined && !Array.isArray(b.primaryGoals)) return false;
  if (typeof b.trainingFrequency !== "number" || b.trainingFrequency < 1) return false;
  if (!Array.isArray(b.injuries)) return false;
  if (!Array.isArray(b.preferredEquipment) || b.preferredEquipment.length === 0) return false;
  if (typeof b.dietApproach !== "string" || !b.dietApproach) return false;

  return true;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const body = await request.json();

    if (!validatePayload(body)) {
      return NextResponse.json(
        { error: "Invalid training background data" },
        { status: 400 }
      );
    }

    // Upsert into coach_profiles — user_id has a UNIQUE constraint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("coach_profiles")
      .upsert(
        {
          user_id: userId,
          training_background: body,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to upsert coach_profiles:", error);
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("Onboarding route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
