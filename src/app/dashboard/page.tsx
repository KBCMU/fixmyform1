import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSignOutButton } from "@/components/auth/AppSignOutButton";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        <div className="p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex justify-between items-center mb-8">
            <h1
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-bebas-neue), sans-serif",
                color: "var(--text-primary)",
                letterSpacing: "0.02em",
              }}
            >
              DASHBOARD
            </h1>
            <AppSignOutButton />
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Welcome back!
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {email}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                ID: {user.id}
              </p>
            </div>

            <div className="pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--accent-teal)" }}>
                Your Account
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                You are authenticated. This is a protected route.
              </p>
            </div>

            <div className="pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Link
                href="/form"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all duration-200"
                style={{
                  background: "var(--accent-lime)",
                  color: "var(--bg-primary)",
                  borderRadius: "2px",
                }}
              >
                Go to Form Analysis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
