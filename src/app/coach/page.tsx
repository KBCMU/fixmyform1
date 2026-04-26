"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatInterface from "@/components/coach/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkSupabase } from "@/lib/supabase/clerk-browser";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CoachPage() {
  const { user, loading: authLoading } = useAuth();
  const { supabase, sessionLoaded } = useClerkSupabase();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [hasProgram, setHasProgram] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !sessionLoaded) {
      if (!user) setChecking(false);
      return;
    }

    async function checkProgram() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("user_programs")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1) as { data: { id: string }[] | null };
        setHasProgram(!!data && data.length > 0);
      } catch {
        setHasProgram(false);
      } finally {
        setChecking(false);
      }
    }
    checkProgram();
  }, [user, sessionLoaded, supabase]);

  if (authLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#000000" }}>
        <Header />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Header />
      <main className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-1000 ease-out ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
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
              AI <span className="italic" style={{ opacity: 0.7 }}>COACH</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
              Your intelligent training companion.
            </p>
          </div>

          {checking && (
            <div
              className={`text-center transition-all duration-1000 delay-300 ease-out ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}
            >
              Loading...
            </div>
          )}

          {!checking && !hasProgram && (
            <div
              className={`transition-all duration-1000 delay-300 ease-out ${
                loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
                {/* Thin top rule */}
                <div style={{ width: "40px", height: "1px", background: "rgba(226,178,139,0.3)", margin: "0 auto 40px" }} />

                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="rgba(226,178,139,0.5)"
                  viewBox="0 0 24 24"
                  style={{ margin: "0 auto 24px", display: "block" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>

                <h3
                  style={{
                    fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
                    fontSize: "clamp(22px, 3vw, 30px)",
                    color: "rgba(255,255,255,0.85)",
                    letterSpacing: "-0.01em",
                    marginBottom: "16px",
                    lineHeight: 1.1,
                  }}
                >
                  Your program comes first.
                </h3>

                <p style={{
                  color: "rgba(255,255,255,0.38)",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  marginBottom: "40px",
                  fontWeight: 300,
                }}>
                  Your coach draws from your training plan to give advice that actually fits your lifting. Build a program to start the conversation.
                </p>

                <Link
                  href="/program"
                  style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px", textDecoration: "none" }}
                  className="group"
                >
                  <span style={{
                    fontSize: "10px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "#E2B28B",
                    opacity: 0.75,
                    transition: "opacity 0.3s ease",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
                  >
                    Build my program
                  </span>
                  <div style={{
                    height: "1px",
                    width: "32px",
                    background: "#E2B28B",
                    opacity: 0.4,
                    transition: "width 0.4s ease, opacity 0.4s ease",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.width = "64px"; e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.width = "32px"; e.currentTarget.style.opacity = "0.4"; }}
                  />
                </Link>

                {/* Thin bottom rule */}
                <div style={{ width: "40px", height: "1px", background: "rgba(255,255,255,0.06)", margin: "48px auto 0" }} />
              </div>
            </div>
          )}

          {!checking && hasProgram && (
            <div
              className={`transition-all duration-1000 delay-300 ease-out ${
                loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <ChatInterface />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
