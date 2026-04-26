"use client";

import Hero from "@/components/Hero";
import Header from "@/components/Header";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { MessageCircle, Brain, Target, Video } from "lucide-react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCoachVisible, setIsCoachVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const coachRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsCoachVisible(true);
        }
      },
      { threshold: 0.08 }
    );

    if (coachRef.current) {
      observer.observe(coachRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-black" style={{ background: "#000000" }}>
      <Header />
      <main>
        <Hero />
        <Features />

        {/* Tech Section - Museum / Gallery Aesthetic */}
        <section
          ref={sectionRef}
          className="pt-16 pb-20 px-6 lg:px-12 relative bg-black"
        >
          <div className="bg-noise absolute inset-0 pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Elegant Header */}
            <div className={`mb-24 text-center transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <span
                className="text-[10px] font-medium tracking-[0.3em] uppercase block mb-6 text-white/40"
              >
                The Engine
              </span>
              <h2
                className="font-serif text-white leading-none"
                style={{ fontSize: "clamp(40px, 5vw, 64px)", letterSpacing: "-0.01em" }}
              >
                Anatomy of precision.
              </h2>
            </div>

            {/* Seamless Grid (No Borders) */}
            <div className="grid md:grid-cols-3 gap-16 md:gap-24">
              {[
                {
                  title: "Form Correction",
                  value: "AI",
                  unit: "Analysis",
                  description: "Upload your video and receive instant, personalized coaching cues to improve technique and prevent injury.",
                },
                {
                  title: "Diet Plans",
                  value: "100%",
                  unit: "Customized",
                  description: "Fuel your progress with tailored nutritional architecture designed specifically for your goals.",
                },
                {
                  title: "Science Programs",
                  value: "Smart",
                  unit: "Programming",
                  description: "Follow periodized, evidence-based hypertrophy systems to ensure consistent strength progression.",
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className={`group transition-all duration-1000 ease-out delay-${(idx + 1) * 200} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
                >
                  {/* Subtle Top Line */}
                  <div className="w-full h-[1px] bg-white/10 mb-8 group-hover:bg-white/30 transition-colors duration-500" />

                  <div
                    className="font-serif text-[var(--accent-warm)] mb-2"
                    style={{ fontSize: "56px", lineHeight: "1" }}
                  >
                    {item.value}
                  </div>

                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-6">
                    {item.unit}
                  </div>

                  <h3 className="font-serif text-2xl text-white/90 mb-4">
                    {item.title}
                  </h3>

                  <p className="text-sm font-light leading-loose text-white/50">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Minimalist CTA Footer area */}
        <section
          className="pt-16 pb-40 px-6 lg:px-12 relative bg-black flex flex-col items-center justify-center text-center overflow-hidden"
        >
          <div className="bg-noise absolute inset-0 pointer-events-none" />

          {/* Very faint background ring for depth */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full point-events-none border border-white/5 opacity-50"
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2
              className="font-serif text-white leading-[1.1] mb-12"
              style={{ fontSize: "clamp(48px, 6vw, 84px)", letterSpacing: "-0.01em" }}
            >
              Begin your<br />
              <i>analysis.</i>
            </h2>

            <Link
              href="/form"
              className="inline-flex flex-col items-center gap-2 group"
            >
              <span className="text-[11px] font-medium tracking-[0.25em] text-[var(--accent-warm)] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                UPLOAD VIDEO
              </span>
              <div className="w-12 h-[1px] bg-[var(--accent-warm)] opacity-40 group-hover:w-24 group-hover:opacity-100 transition-all duration-500" />
            </Link>
          </div>
        </section>
        {/* AI Coach Section */}
        <section
          ref={coachRef}
          className="py-32 px-6 lg:px-12 relative bg-black overflow-hidden"
        >
          <div className="bg-noise absolute inset-0 pointer-events-none" />

          {/* Subtle ambient glow */}
          <div
            className="absolute -top-64 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(212,165,116,0.04) 0%, transparent 70%)" }}
          />

          <div className="max-w-6xl mx-auto relative z-10">

            {/* Section label + heading */}
            <div className={`mb-20 transition-all duration-1000 ease-out ${isCoachVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase block mb-6 text-white/40">
                AI Coaching
              </span>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <h2
                  className="font-serif text-white leading-none"
                  style={{ fontSize: "clamp(40px, 5vw, 64px)", letterSpacing: "-0.01em", maxWidth: "580px" }}
                >
                  Your personal coach,<br />
                  <i className="text-[var(--accent-warm)]">always on.</i>
                </h2>
                <p className="text-sm font-light leading-loose text-white/40 max-w-xs lg:text-right">
                  An intelligent agent that learns your training history, goals, and injury profile — then coaches you in real time.
                </p>
              </div>
            </div>

            {/* Feature grid */}
            <div className="grid md:grid-cols-2 gap-px bg-white/5 rounded-sm overflow-hidden mb-16">
              {[
                {
                  icon: Brain,
                  title: "Knows your history",
                  description: "The agent reads your past form analyses and training logs before every response, so advice is never generic.",
                },
                {
                  icon: MessageCircle,
                  title: "Conversational coaching",
                  description: "Ask anything — exercise selection, programming questions, recovery strategies — and get evidence-based answers tailored to you.",
                },
                {
                  icon: Video,
                  title: "Video-aware feedback",
                  description: "Reference your recent form analysis directly in chat. The coach can discuss what it saw in your lifts and suggest targeted corrections.",
                },
                {
                  icon: Target,
                  title: "Goal-driven programming",
                  description: "Describe your targets and the coach assembles a personalised program, adjusting week by week as you report progress.",
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className={`group p-10 bg-black hover:bg-white/[0.02] transition-all duration-500 ease-out ${isCoachVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${200 + idx * 100}ms` }}
                >
                  <item.icon
                    size={18}
                    className="mb-6 text-[var(--accent-warm)] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-serif text-xl text-white/90 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm font-light leading-loose text-white/40">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-6 border-t border-white/[0.07] transition-all duration-1000 delay-700 ease-out ${isCoachVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <p className="text-[11px] tracking-[0.15em] uppercase text-white/25">
                Personalised onboarding · Runs in your browser · No extra app
              </p>
              <Link
                href="/coach"
                className="inline-flex items-center gap-4 group"
              >
                <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-[var(--accent-warm)] opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  Meet your coach
                </span>
                <div className="w-8 h-[1px] bg-[var(--accent-warm)] opacity-40 group-hover:w-16 group-hover:opacity-100 transition-all duration-500" />
              </Link>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
