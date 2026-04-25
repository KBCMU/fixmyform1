"use client";

import Link from "next/link";

// AuthGate is self-contained — shown only when user is not logged in.
// The parent page handles the conditional rendering based on useAuth().

export default function AuthGate() {
  const redirect = "/program/new";

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        textAlign: "center",
        padding: "48px 32px",
        background: "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "56px",
          height: "56px",
          margin: "0 auto 28px",
          borderRadius: "4px",
          background: "rgba(230,106,35,0.1)",
          border: "1px solid rgba(230,106,35,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#E66A23",
        }}
      >
        <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
          fontSize: "clamp(26px, 5vw, 38px)",
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "0.01em",
          lineHeight: "1.2",
          marginBottom: "12px",
        }}
      >
        Sign in to generate your program
      </h2>

      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "14px",
          lineHeight: "1.6",
          marginBottom: "36px",
          maxWidth: "360px",
          margin: "0 auto 36px",
        }}
      >
        Your answers are saved. Create an account to get your personalised hypertrophy program.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Link
          href={`/signup?redirect=${encodeURIComponent(redirect)}`}
          style={{
            display: "block",
            background: "#E66A23",
            color: "#ffffff",
            borderRadius: "4px",
            padding: "14px 24px",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#D1834B";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#E66A23";
          }}
        >
          Create Account
        </Link>

        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          style={{
            display: "block",
            background: "transparent",
            color: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "4px",
            padding: "14px 24px",
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "rgba(255,255,255,0.4)";
            el.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "rgba(255,255,255,0.2)";
            el.style.color = "rgba(255,255,255,0.75)";
          }}
        >
          Sign In
        </Link>
      </div>

      <p style={{ marginTop: "24px", fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
        No credit card required
      </p>
    </div>
  );
}
