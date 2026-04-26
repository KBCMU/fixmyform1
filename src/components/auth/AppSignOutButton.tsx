"use client";

import { SignOutButton } from "@clerk/nextjs";

export function AppSignOutButton() {
  return (
    <SignOutButton>
      <button
        type="button"
        className="px-4 py-2 text-sm font-medium transition-all duration-200"
        style={{
          color: "var(--danger)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "2px",
        }}
      >
        Sign Out
      </button>
    </SignOutButton>
  );
}
