import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Content-Security-Policy is set per-request in src/proxy.ts instead of here,
  // because it needs a fresh nonce (script-src 'nonce-...') on every request to
  // allow Next.js's own App Router hydration scripts while still blocking
  // injected inline scripts. A static value here can't include a per-request nonce.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
