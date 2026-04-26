import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      { source: "/login", destination: "/sign-in", permanent: false },
      { source: "/signup", destination: "/sign-in", permanent: false },
    ];
  },
};

export default nextConfig;

// Only init Cloudflare for local dev - skip during builds and on Vercel to avoid failures
if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}
