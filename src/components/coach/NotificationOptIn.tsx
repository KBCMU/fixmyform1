"use client";

import { useState } from "react";

interface NotificationOptInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function NotificationOptIn({
  onSuccess,
  onError,
}: NotificationOptInProps) {
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleOptIn = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      // Check if browser supports notifications
      if (!("Notification" in window)) {
        throw new Error("Your browser does not support notifications");
      }

      // Check for service worker support
      if (!("serviceWorker" in navigator)) {
        throw new Error("Your browser does not support service workers");
      }

      // Request notification permission if not granted
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Register service worker if not already registered
      if (!navigator.serviceWorker.controller) {
        await navigator.serviceWorker.register("/sw.js");
      }

      // Get push subscription
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      // If no existing subscription, create a new one
      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error("VAPID public key is not configured");
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // Send subscription to backend
      const response = await fetch("/api/coach/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as Record<string, unknown>;
        throw new Error((error.error as string) || "Failed to register subscription");
      }

      setSubscribed(true);
      setFeedback({
        type: "success",
        message: "Notifications enabled! You'll get reminders for your workouts.",
      });
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to enable notifications";
      setFeedback({ type: "error", message: errorMessage });
      onError?.(errorMessage);
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOptOut = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Notify backend to remove subscription
          const response = await fetch("/api/coach/notifications", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to unsubscribe from notifications");
          }

          // Unsubscribe from push service
          await subscription.unsubscribe();
        }
      }

      setSubscribed(false);
      setFeedback({
        type: "success",
        message: "Notifications disabled.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disable notifications";
      setFeedback({ type: "error", message: errorMessage });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mt-8 p-6 rounded-lg"
      style={{ backgroundColor: "#0F0F0F", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <h3
        style={{
          color: "#FFFFFF",
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "12px",
        }}
      >
        Workout Reminders
      </h3>

      <p
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: "14px",
          marginBottom: "16px",
        }}
      >
        Get push notifications to remind you about your scheduled workouts.
      </p>

      {feedback && (
        <div
          style={{
            backgroundColor:
              feedback.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: feedback.type === "success" ? "#22C55E" : "#EF4444",
            padding: "12px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {feedback.message}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        {!subscribed ? (
          <button
            onClick={handleOptIn}
            disabled={loading}
            style={{
              backgroundColor: "#E66A23",
              color: "#FFFFFF",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Setting up..." : "Enable Notifications"}
          </button>
        ) : (
          <button
            onClick={handleOptOut}
            disabled={loading}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              color: "#EF4444",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #EF4444",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Disabling..." : "Disable Notifications"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Convert VAPID public key from URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
