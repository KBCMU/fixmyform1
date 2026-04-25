"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgramView from "@/components/program/ProgramView";
import type { GeneratedProgram } from "@/lib/programBuilder/types";

const SESSION_KEY = "fixmyform_generated_program";

export default function ProgramViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [program, setProgram] = useState<GeneratedProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setLoaded(true), 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    // Try sessionStorage first (just-generated programs)
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed: GeneratedProgram = JSON.parse(raw);
        // Accept if the stored program matches this id (or if there is no id set yet)
        if (!parsed.id || parsed.id === id) {
          setProgram(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {
      // sessionStorage unavailable or parse error — fall through to API
    }

    // Future: fetch from Supabase by id
    // For now, show not-found state
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "#000000" }}>
        <Header />
        <main className="pt-32 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 rounded w-1/3" style={{ background: "#0A0A0A" }} />
              <div className="h-4 rounded w-2/3" style={{ background: "#0A0A0A" }} />
              <div className="h-4 rounded w-1/2" style={{ background: "#0A0A0A" }} />
              <div className="h-48 rounded mt-8" style={{ background: "#0A0A0A" }} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen" style={{ background: "#000000" }}>
        <Header />
        <main className="pt-32 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center" style={{ paddingTop: "80px" }}>
            {/* Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "3px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <svg width="24" height="24" fill="none" stroke="#444444" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
                fontSize: "clamp(24px, 4vw, 40px)",
                fontWeight: 400,
                color: "#FFFFFF",
                marginBottom: "12px",
              }}
            >
              Program Not Found
            </h1>
            <p style={{ color: "#666666", fontSize: "14px", marginBottom: "32px", maxWidth: "380px", margin: "0 auto 32px" }}>
              This program may have expired from session storage, or the link is invalid.
            </p>
            <button
              onClick={() => router.push("/program/new")}
              style={{
                padding: "13px 28px",
                background: "#E66A23",
                color: "#000000",
                border: "none",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#A4430F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E66A23";
              }}
            >
              Build New Program
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Header />
      <main>
        {/* Page hero */}
        <section
          className={`pt-24 pb-4 px-6 lg:px-8 transition-all duration-700 ease-out ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="max-w-4xl mx-auto">
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: "6px",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              Your Program
            </p>
          </div>
        </section>

        {/* Program content */}
        <section
          className={`pb-24 px-6 lg:px-8 transition-all duration-700 delay-200 ease-out ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="max-w-4xl mx-auto">
            <ProgramView program={program} editable />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
