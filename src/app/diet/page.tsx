"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DietPage() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 150);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col" style={{ background: "#000000" }}>
            <Header />

            <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6">
                {/* Subtle background glow */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-10"
                    style={{
                        background: "radial-gradient(circle, rgba(230,106,35,0.1) 0%, transparent 70%)",
                        filter: "blur(40px)",
                    }}
                />

                <div className="z-10 text-center max-w-2xl">
                    <div
                        className={`w-12 h-[1px] bg-white/20 mx-auto mb-8 transition-all duration-1000 ease-out ${loaded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                    />

                    <h3
                        className={`text-[10px] uppercase tracking-[0.3em] text-[var(--accent-warm)] mb-6 transition-all duration-1000 delay-300 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                    >
                        Nutritional Architecture
                    </h3>

                    <h1
                        className={`font-serif text-white text-6xl md:text-8xl mb-8 leading-none transition-all duration-1000 delay-500 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                        style={{ letterSpacing: "-0.02em" }}
                    >
                        Coming <span className="italic text-white/70">Soon</span>
                    </h1>

                    <p
                        className={`text-white/40 text-sm tracking-wide font-light max-w-md mx-auto mb-12 transition-all duration-1000 delay-700 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                    >
                        Our deterministic approach to macronutrient mapping and metabolic optimization is currently in development.
                    </p>

                    <Link
                        href="/"
                        className={`inline-block border-b border-white/20 pb-1 text-[10px] tracking-[0.2em] uppercase text-white/70 hover:text-white hover:border-white/60 transition-all duration-500 delay-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    >
                        Return to Exhibition
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
