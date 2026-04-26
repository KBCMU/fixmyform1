"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInInner() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect_url") || "/";

  return (
    <SignIn
      forceRedirectUrl={redirect}
      signUpFallbackRedirectUrl={redirect}
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-none",
          headerTitle: "text-[var(--text-primary)]",
          headerSubtitle: "text-[var(--text-muted)]",
          socialButtonsBlockButton:
            "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]",
          formFieldLabel: "text-[var(--text-secondary)]",
          formFieldInput:
            "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]",
          footerActionLink: "text-[var(--accent-teal)]",
          formButtonPrimary:
            "bg-[var(--accent-lime)] text-[var(--bg-primary)] hover:opacity-90",
        },
      }}
    />
  );
}

export function SignInPanel() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-zinc-500">Loading…</div>}>
      <SignInInner />
    </Suspense>
  );
}
