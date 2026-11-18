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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The store is never shown inside another site's frame.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
