"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PricingPage() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 150);
        return () => clearTimeout(timer);
    }, []);

    const tiers = [
        {
            name: "Free",
            price: "$0",
            description: "Foundational biomechanics",
            features: [
                "Interactive 3D exercise library",
                "Step-by-step execution guides",
                "Targeted muscle group mapping",
            ],
            buttonText: "Start Free",
            href: "/dashboard",
            isPopular: false,
        },
        {
            name: "Pro",
            price: "$15",
            period: "/mo",
            description: "Clinical-grade form analysis",
            features: [
                "Everything in Free",
                "33-point skeletal tracking",
                "Real-time kinematic feedback",
                "Joint angle deviation scoring",
                "Unlimited video uploads",
            ],
            buttonText: "Upgrade to Pro",
            href: "/upgrade",
            isPopular: true,
        },
        {
            name: "Pro Plus",
            price: "$30",
            period: "/mo",
            description: "Total physical architecture",
            features: [
                "Everything in Pro",
                "Personalized hypertrophy programs",
                "Custom diet & macronutrient plans",
                "Priority AI processing speed",
                "Direct export for physiotherapists",
            ],
            buttonText: "Unlock Pro Plus",
            href: "/upgrade-plus",
            isPopular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-black flex flex-col" style={{ background: "#000000" }}>
            <Header />

            <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-6 relative overflow-hidden">
                {/* Subtle background glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none opacity-20"
                    style={{
                        background: "radial-gradient(circle, rgba(230,106,35,0.1) 0%, transparent 70%)",
                        filter: "blur(60px)",
                    }}
                />

                <div className="z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-24">
                        <h1
                            className={`font-serif text-white text-5xl md:text-7xl transition-all duration-1000 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                        >
                            Invest in your <span className="italic text-white/80">structure.</span>
                        </h1>
                        <p
                            className={`text-white/50 mt-6 text-sm tracking-wide max-w-md mx-auto transition-all duration-1000 delay-300 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                        >
                            Select a tier to begin the process of physical perfection and deterministic joint correction.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        {tiers.map((tier, index) => (
                            <div
                                key={tier.name}
                                className={`relative border border-white/10 bg-[#050505] p-10 flex flex-col transition-all duration-1000 ease-out hover:border-white/30`}
                                style={{
                                    transitionDelay: `${500 + (index * 200)}ms`,
                                    opacity: loaded ? 1 : 0,
                                    transform: loaded ? 'translateY(0)' : 'translateY(24px)'
                                }}
                            >
                                {tier.isPopular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[var(--accent-orange)] text-black text-[9px] uppercase tracking-[0.2em] font-medium">
                                        Most Popular
                                    </div>
                                )}

                                <h3 className="text-white text-[11px] uppercase tracking-[0.25em] mb-4">{tier.name}</h3>
                                <div className="flex items-baseline mb-2">
                                    <span className="font-serif text-5xl text-white">{tier.price}</span>
                                    {tier.period && <span className="text-white/40 text-xs ml-1">{tier.period}</span>}
                                </div>
                                <p className="text-white/50 text-xs font-light mb-8 h-8">{tier.description}</p>

                                <ul className="flex-1 space-y-4 mb-10">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-start text-white/70 text-[11px] tracking-wide font-light">
                                            <span className="text-[var(--accent-warm)] mr-3 mt-0.5 opacity-80">✦</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={tier.href}
                                    className={`w-full text-center py-4 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${tier.isPopular
                                            ? 'bg-white text-black hover:bg-white/90'
                                            : 'border border-white/20 text-white/90 hover:bg-white hover:text-black'
                                        }`}
                                >
                                    {tier.buttonText}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
