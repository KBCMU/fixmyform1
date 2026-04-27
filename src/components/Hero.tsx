"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Gentle staggered reveal on mount
    const timer = setTimeout(() => setLoaded(true), 200);

    // Smooth parallax scroll listener
    const handleScroll = () => {
      if (sectionRef.current) {
        setScrollY(window.scrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Delay the fade out: stay 100% visible for the first 400px of scroll, then fade out smoothly
  const textOpacity = Math.max(0, 1 - Math.max(0, scrollY - 400) / 450);

  // Parallax transform styles
  // Slightly reduced downward pull to keep text above the footer gradient longer
  const textTransform = `translateY(${scrollY * 0.25}px)`;
  const ringTransform = `translate(-50%, -50%) translateY(${scrollY * 0.15}px)`;
  const mannequinTransform = `translateY(${scrollY * 0.05}px)`; // Barely moves

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[120vh] min-h-[900px] overflow-hidden bg-[#0a0a0c]"
    >
      {/* === STUDIO BACKDROP === */}
      {/* Creates a spotlight/vignette effect on a dark gray wall instead of flat black */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(30,30,35,1) 0%, rgba(10,10,12,1) 70%, rgba(5,5,5,1) 100%)",
        }}
      />
      <div className="bg-noise absolute inset-0 pointer-events-none z-0 opacity-30" />

      {/* === THE NEON RING LIGHT === */}
      {/* Bold, glowing neon ring matching the reference video */}
      <div
        className={`absolute top-[52%] left-[52%] z-0 rounded-full pointer-events-none transition-all duration-1000 ease-in-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          width: "min(60vw, 750px)",
          height: "min(60vw, 750px)",
          border: "6px solid rgba(255, 255, 255, 0.9)",
          boxShadow: `
            0 0 80px rgba(230, 106, 35, 0.5),
            inset 0 0 80px rgba(230, 106, 35, 0.5),
            0 0 20px rgba(255, 255, 255, 0.8),
            inset 0 0 20px rgba(255, 255, 255, 0.8)
          `,
          transform: ringTransform,
          filter: "blur(1px)",
        }}
      />

      {/* Ambient warm orange fill behind model */}
      <div
        className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none z-0 animate-ambient-glow"
        style={{
          background: "radial-gradient(circle, rgba(230,106,35,0.15) 0%, transparent 60%)",
        }}
      />

      {/* === TEXT LAYER 1: "Mastery of" (Functional Link Layer) === */}
      {/* Removed pointer-events-none so buttons can be clicked. z-20 puts it above background/model */}
      <div
        className="absolute top-[35%] left-[10%] xl:left-[15%] z-20 flex flex-col items-start transition-opacity duration-150"
        style={{
          transform: textTransform,
          opacity: loaded ? textOpacity : 0
        }}
      >
        <h1
          className={`font-serif text-white opacity-90 leading-[1.05] transition-all duration-1000 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
          style={{ fontSize: "clamp(60px, 8vw, 120px)", letterSpacing: "-0.01em" }}
        >
          Mastery of<br />
          <span className="italic text-white/80">biomechanics</span>
        </h1>

        <p className={`mt-6 text-sm text-white/50 max-w-sm leading-relaxed transition-all duration-1000 delay-300 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          High-fidelity analysis. Perfect your form, get customized diet plans, and follow science-based programs to maximize true strength.
        </p>

        {/* Functional CTA Button */}
        <Link
          href="/form"
          className={`group mt-10 flexitems-center gap-4 px-8 py-4 border border-white/20 text-white/90 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 ease-out delay-500 backdrop-blur-sm hover:bg-white hover:text-black ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          Begin Analysis
        </Link>
      </div>

      {/* === GALLERY PLAQUE/STAT (Top Right) === */}
      <div
        className={`absolute top-[28%] right-[4%] xl:right-[10%] z-20 max-w-[200px] hidden md:block transition-opacity duration-1000 delay-500`}
        style={{
          transform: textTransform,
          opacity: loaded ? textOpacity : 0
        }}
      >
        <div className="w-8 h-[1px] bg-white/20 mb-4" />
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">Instant Feedback</h3>
        <p className="font-serif text-3xl text-white/90">AI Coaching</p>
        <p className="text-xs text-white/40 mt-3 leading-relaxed font-light">
          Upload your video to receive personalized, actionable feedback to perfect your lifting technique.
        </p>
      </div>

      {/* === GALLERY PLAQUE/STAT (Bottom Right) === */}
      <div
        className={`absolute top-[65%] right-[4%] xl:right-[10%] z-20 max-w-[220px] hidden md:block transition-opacity duration-1000 delay-700`}
        style={{
          transform: textTransform,
          opacity: loaded ? textOpacity : 0
        }}
      >
        <div className="w-8 h-[1px] bg-[var(--accent-orange)] mb-4 opacity-50" />
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-warm)] mb-3">Complete System</h3>
        <p className="font-serif text-3xl text-white/90">Diet & Training</p>
        <p className="text-xs text-white/40 mt-3 leading-relaxed font-light">
          Fuel your progress with custom diet plans and follow evidence-based hypertrophy programs.
        </p>
      </div>

      {/* === CENTERPIECE MANNEQUIN IMAGE === */}
      <div
        className="absolute inset-0 flex items-end md:items-center justify-center pointer-events-none z-15"
      >
        <div
          className={`relative w-[min(900px,95vw)] h-[90%] md:h-[110%] transition-opacity duration-1000 delay-100 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: mannequinTransform,
            // Fade top/bottom AND left/right so the avatar has no hard edges
            maskImage: "linear-gradient(to top, transparent 5%, black 20%, black 85%, transparent 100%), linear-gradient(to right, transparent 2%, black 12%, black 88%, transparent 98%)",
            WebkitMaskImage: "linear-gradient(to top, transparent 5%, black 20%, black 85%, transparent 100%), linear-gradient(to right, transparent 2%, black 12%, black 88%, transparent 98%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "destination-in",
          }}
        >
          {/* Removed scale-110, setting quality=100 for max sharpness */}
          <Image
            src="/workout-mannequin.png"
            alt="Anatomical standing man showing muscular structure in dramatic lighting"
            fill
            priority
            quality={100}
            className="object-contain object-bottom md:object-center drop-shadow-2xl"
            sizes="(max-width: 768px) 100vw, 900px"
          />
        </div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div
        className="absolute bottom-0 inset-x-0 h-64 z-30 pointer-events-none"
        style={{ background: "linear-gradient(to top, #000000 0%, transparent 100%)" }}
      />
    </section>
  );
}
