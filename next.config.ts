import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

// Only init Cloudflare for local dev - skip during builds and on Vercel to avoid failures
if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}
