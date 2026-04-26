import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { registerPushSubscription, unregisterPushSubscription } from "@/lib/agent/notifications";

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Validate subscription object structure
    if (
      !body || typeof body !== "object" || !("subscription" in body) ||
      !body.subscription ||
      typeof body.subscription !== "object"
    ) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    const sub = body.subscription as Record<string, unknown>;
    if (
      !sub.endpoint ||
      typeof sub.endpoint !== "string" ||
      !sub.keys ||
      typeof sub.keys !== "object"
    ) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    const keys = sub.keys as Record<string, unknown>;
    if (!keys.auth || typeof keys.auth !== "string" ||
        !keys.p256dh || typeof keys.p256dh !== "string") {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    const subscription: PushSubscriptionJSON = {
      endpoint: sub.endpoint,
      keys: {
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
    };

    const result = await registerPushSubscription(userId, subscription);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Subscription registered" });
  } catch (err) {
    console.error("Notification registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const endpoint = (body.endpoint ?? null) as string | null;
    const endpointStr = endpoint || undefined;

    const result = await unregisterPushSubscription(userId, endpointStr);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (err) {
    console.error("Notification unregistration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
