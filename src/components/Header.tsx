"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "Form", href: "/form" },
    { name: "Diet", href: "/diet" },
    { name: "Program", href: "/program" },
    { name: "Coach", href: "/coach" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname?.startsWith(href);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-8 lg:px-12 py-8 mix-blend-difference">
      <nav className="flex w-full items-center">
        {/* Gallery-style minimal logo - Top Left */}
        <div className="w-[200px] flex-shrink-0">
          <Link href="/" className="inline-flex items-center group">
            <span
              className="text-[12px] font-medium tracking-[0.25em] text-white opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            >
              FIXMYFORM
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Center wide tracked */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-12">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className="text-[11px] font-medium tracking-[0.2em] transition-all duration-300 uppercase"
              style={{
                color: isActive(tab.href) ? "var(--text-primary)" : "rgba(255, 255, 255, 0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive(tab.href)) {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
                }
              }}
            >
              {tab.name}
            </Link>
          ))}
        </div>

        {/* Empty right div to balance the logo width so tabs stay truly centered */}
        <div className="w-[200px] flex-shrink-0 hidden md:flex justify-end">
        </div>
      </nav>
    </header>
  );
}
