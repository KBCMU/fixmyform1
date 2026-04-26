import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixMyForm — AI-Powered Exercise Form Analysis",
  description:
    "Fix your form. Build real strength. Upload your exercise videos and get instant AI-powered biomechanical feedback to prevent injuries and maximize gains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} antialiased selection:bg-white/20 selection:text-white`}
      >
        <ClerkProvider
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-in"}
        >
          <AuthProvider>{children}</AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
