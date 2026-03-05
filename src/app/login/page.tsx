"use client";

import { useState } from "react";
import { signIn } from "@/app/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-block text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-bebas-neue), sans-serif",
              color: "var(--accent-lime)",
              letterSpacing: "0.05em",
            }}
          >
            FIXMYFORM
          </Link>
        </div>

        <div
          className="p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Sign in to your account to continue your training.{" "}
            <Link
              href="/signup"
              className="font-medium transition-colors"
              style={{ color: "var(--accent-teal)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent-lime)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--accent-teal)")
              }
            >
              Create account
            </Link>
          </p>

          <form action={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="p-3 text-sm"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 text-sm transition-colors duration-200"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  borderRadius: "2px",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent-teal)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-subtle)")
                }
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 text-sm transition-colors duration-200"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  borderRadius: "2px",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent-teal)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-subtle)")
                }
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "var(--accent-lime)",
                color: "var(--bg-primary)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--accent-lime-dark)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-lime)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
