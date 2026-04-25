"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface SavedProgram {
  id: string;
  name: string;
  created_at: string;
  profile: { experience?: string; daysPerWeek?: number; selectedSplit?: string };
}

const SPLIT_LABELS: Record<string, string> = {
  full_body: "Full Body",
  upper_lower: "Upper / Lower",
  anterior_posterior: "Anterior / Posterior",
  push_pull_legs: "Push / Pull / Legs",
  upper_lower_ppl: "UL + PPL",
};

export default function ProgramPage() {
  const [loaded, setLoaded] = useState(false);
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchPrograms() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("user_programs")
          .select("id, name, created_at, profile")
          .order("created_at", { ascending: false }) as { data: SavedProgram[] | null };
        setPrograms(data ?? []);
      } catch {
        // Table may not exist yet
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, [user]);

  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Header />
      <main className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div
            className={`text-center mb-16 transition-all duration-1000 ease-out ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          >
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
                fontSize: "clamp(36px, 6vw, 68px)",
                lineHeight: 1,
                color: "#ffffff",
                letterSpacing: "-0.01em",
                marginBottom: "12px",
              }}
            >
              YOUR <span className="italic" style={{ opacity: 0.7 }}>PROGRAMS</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
              Personalised hypertrophy programs built for your goals.
            </p>
          </div>

          {/* Build New CTA */}
          <div
            className={`text-center mb-12 transition-all duration-1000 delay-300 ease-out ${loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            <Link
              href="/program/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "#E66A23",
                color: "#ffffff",
                borderRadius: "4px",
                padding: "16px 40px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#D1834B")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#E66A23")}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Build New Program
            </Link>
          </div>

          {/* Programs list */}
          {user && !loading && programs.length > 0 && (
            <div
              className={`transition-all duration-1000 delay-500 ease-out ${loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#AAAAAA",
                  fontFamily: "'Geist Mono', monospace",
                  marginBottom: "16px",
                }}
              >
                Saved Programs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {programs.map((prog) => (
                  <Link
                    key={prog.id}
                    href={`/program/${prog.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "18px 20px",
                      background: "#0A0A0A",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "4px",
                      textDecoration: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  >
                    <div>
                      <div style={{ color: "#ffffff", fontSize: "15px", fontWeight: 500, marginBottom: "4px" }}>
                        {prog.name}
                      </div>
                      <div style={{ color: "#666666", fontSize: "12px" }}>
                        {SPLIT_LABELS[prog.profile?.selectedSplit ?? ""] ?? prog.profile?.selectedSplit}
                        {prog.profile?.daysPerWeek ? ` · ${prog.profile.daysPerWeek} days/week` : ""}
                      </div>
                    </div>
                    <div style={{ color: "#666666", fontSize: "11px", fontFamily: "'Geist Mono', monospace" }}>
                      {new Date(prog.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for logged-in users */}
          {user && !loading && programs.length === 0 && (
            <div
              className={`text-center transition-all duration-1000 delay-500 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
              style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "32px" }}
            >
              No saved programs yet. Build your first one above.
            </div>
          )}

          {/* Not logged in */}
          {!user && !loading && (
            <div
              className={`text-center transition-all duration-1000 delay-500 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
              style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "32px" }}
            >
              <Link href="/login" style={{ color: "#E66A23", textDecoration: "underline", textDecorationColor: "rgba(230,106,35,0.3)" }}>
                Sign in
              </Link>
              {" "}to save and view your programs.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
