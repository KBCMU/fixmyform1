"use client";

import { useEffect, useState, useRef } from "react";

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  const steps = [
    {
      num: "01",
      title: "Analyze Form",
      subtitle: "The Foundation",
      description:
        "Upload your video. Our AI instantly breaks down your biomechanics and provides actionable coaching to perfect your technique.",
    },
    {
      num: "02",
      title: "Fuel Growth",
      subtitle: "Nutrition",
      description:
        "Receive a customized diet plan optimized to fuel your workouts, maximize recovery, and accelerate your results.",
    },
    {
      num: "03",
      title: "Build Strength",
      subtitle: "The Masterpiece",
      description:
        "Follow science-based, periodized training programs designed to push your limits and build genuine, lasting strength.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-40 px-6 lg:px-12 relative bg-black overflow-hidden"
    >
      <div className="bg-noise absolute inset-0 pointer-events-none" />

      {/* Subtle ambient light on the left side to separate from complete darkness */}
      <div
        className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(230,106,35,0.03) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row gap-20">

        {/* Left Column: Huge Elegant Heading */}
        <div className="md:w-5/12 pt-10">
          <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <span
              className="text-[10px] font-medium tracking-[0.3em] uppercase block mb-8 text-white/40"
            >
              Methodology
            </span>
            <h2
              className="font-serif text-white leading-[1.1] tracking-[-0.01em]"
              style={{ fontSize: "clamp(48px, 6vw, 84px)" }}
            >
              The <i>process</i><br />
              of physical<br />
              perfection.
            </h2>
            <div className="mt-16 w-12 h-[1px] bg-white/20" />
            <p className="mt-8 text-sm font-light text-white/50 leading-relaxed max-w-sm">
              True strength lies not just in exertion, but in absolute control. Our analytical framework deconstructs human movement to ensure flawless execution.
            </p>
          </div>
        </div>

        {/* Right Column: Elegant staggered list instead of boxes */}
        <div className="md:w-7/12 flex flex-col gap-16 md:gap-24 mt-16 md:mt-0">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className={`relative flex gap-8 transition-all duration-1000 ease-out delay-${(idx + 1) * 300} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
            >
              {/* Minimalist Number */}
              <div
                className="text-white/20 font-serif shrink-0 mt-[-8px]"
                style={{ fontSize: "60px", lineHeight: "1" }}
              >
                {step.num}
              </div>

              {/* Text Content */}
              <div className="flex-1 pt-2">
                <span className="text-[9px] uppercase tracking-[0.25em] text-[var(--accent-warm)] mb-2 block">
                  {step.subtitle}
                </span>
                <h3
                  className="font-serif text-4xl mb-4 text-white/90"
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm font-light leading-loose text-white/50 max-w-md"
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
