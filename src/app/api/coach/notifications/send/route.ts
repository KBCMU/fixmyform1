import { NextResponse } from "next/server";
import { sendAllWorkoutReminders } from "@/lib/agent/notifications";

/**
 * Endpoint to trigger sending workout reminders
 * Called by cron jobs or manual triggers
 * No authentication required (protect with environment-based token if needed)
 */
export async function POST(request: Request) {
  try {
    // Optional: Add a simple secret token check for security
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await sendAllWorkoutReminders();

    return NextResponse.json({
      success: true,
      sent: result.sent,
      error: result.error,
    });
  } catch (err) {
    console.error("Send notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
