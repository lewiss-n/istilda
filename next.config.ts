import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker runs the small self-contained "standalone" server. Vercel builds its own way.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    // Product photo uploads pass through the admin proxy check.
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
