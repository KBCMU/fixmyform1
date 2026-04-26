/**
 * Notification service for sending workout reminders via Web Push API
 */

import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPrivateKey && vapidPublicKey) {
  webpush.setVapidDetails(
    "mailto:support@fixmyform.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

/**
 * Register a push subscription for a user
 */
export async function registerPushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("push_subscriptions")
      .insert({
        user_id: userId,
        subscription,
      });

    if (error) {
      console.error("Failed to register push subscription:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error registering push subscription:", err);
    return { success: false, error: "Failed to register subscription" };
  }
}

/**
 * Unregister push subscriptions for a user
 */
export async function unregisterPushSubscription(
  userId: string,
  endpoint?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (endpoint) {
      query = query.eq("subscription", JSON.stringify({ endpoint }));
    }

    const { error } = await query;

    if (error) {
      console.error("Failed to unregister push subscription:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error unregistering push subscription:", err);
    return { success: false, error: "Failed to unregister subscription" };
  }
}

/**
 * Send a workout reminder to a user
 */
export async function sendWorkoutReminder(
  userId: string,
  dayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get user's push subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions, error: subError } = await (supabase as any)
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId);

    if (subError) {
      console.error("Failed to fetch subscriptions:", subError);
      return { success: false, error: "Failed to fetch subscriptions" };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true }; // No subscriptions, not an error
    }

    const payload = {
      title: `${dayName} Workout Scheduled`,
      body: "Time to hit your training session. Let's improve your form!",
      icon: "/icon-192x192.png",
    };

    // Send to all subscriptions
    const sendPromises = subscriptions.map((sub: Record<string, unknown>) => {
      const subscription = sub.subscription as PushSubscription;
      return webpush
        .sendNotification(subscription, JSON.stringify(payload))
        .catch((err) => {
          console.error(`Failed to send notification: ${err.message}`);
          // If subscription is invalid, mark for deletion
          if (
            err.statusCode === 410 ||
            err.statusCode === 404 ||
            err.message.includes("invalid")
          ) {
            return unregisterPushSubscription(userId, subscription.endpoint);
          }
        });
    });

    await Promise.all(sendPromises);
    return { success: true };
  } catch (err) {
    console.error("Error sending workout reminder:", err);
    return { success: false, error: "Failed to send reminder" };
  }
}

/**
 * Send reminders to all users who have workouts today
 * Based on their training frequency from coach_profiles
 */
export async function sendAllWorkoutReminders(): Promise<{
  sent: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = dayNames[dayOfWeek];

    // Get all users with active push subscriptions and coach profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: users, error: usersError } = await (supabase as any)
      .from("push_subscriptions")
      .select(
        `
        user_id,
        coach_profiles(training_background)
      `
      )
      .neq("user_id", null);

    if (usersError) {
      console.error("Failed to fetch users:", usersError);
      return { sent: 0, error: "Failed to fetch users" };
    }

    if (!users || users.length === 0) {
      return { sent: 0 };
    }

    // Determine which users should get reminders based on training frequency
    let sentCount = 0;

    interface UserRecord {
      user_id: string;
      coach_profiles: {
        training_background: Record<string, unknown>;
      } | null;
    }

    for (const userRecord of users as UserRecord[]) {
      const userId = userRecord.user_id;
      const coachProfile = userRecord.coach_profiles;

      if (!coachProfile) continue;

      const trainingBackground = coachProfile.training_background as Record<string, unknown>;
      if (!trainingBackground || !trainingBackground.trainingFrequency) continue;

      // Simple heuristic: if training frequency is >= 4 days, remind on weekdays
      // if >= 5 days, remind every day, etc.
      const trainingFrequency =
        (trainingBackground.trainingFrequency as number) || 3;

      let shouldRemind = false;

      if (trainingFrequency >= 5) {
        // 5+ days: remind every day
        shouldRemind = true;
      } else if (trainingFrequency === 4) {
        // 4 days: skip Sunday
        shouldRemind = dayOfWeek !== 0;
      } else if (trainingFrequency === 3) {
        // 3 days: Monday, Wednesday, Friday
        shouldRemind = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      } else if (trainingFrequency <= 2) {
        // 1-2 days: weekdays Monday-Friday
        shouldRemind = dayOfWeek >= 1 && dayOfWeek <= 5;
      }

      if (shouldRemind) {
        const result = await sendWorkoutReminder(userId, todayName);
        if (result.success) {
          sentCount++;
        }
      }
    }

    return { sent: sentCount };
  } catch (err) {
    console.error("Error sending all workout reminders:", err);
    return { sent: 0, error: "Failed to send reminders" };
  }
}
