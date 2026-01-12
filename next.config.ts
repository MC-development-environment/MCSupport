import createNextIntlPlugin from "next-intl/plugin";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const withNextIntl = createNextIntlPlugin();

const nextConfig: import("next").NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    (process.env.NEXT_PUBLIC_BASE_URL || "")?.replace(/^https?:\/\//, ""),
    ".trycloudflare.com", // Dominio para el tunel
  ],
  output: "standalone",
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    const csp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' blob: data: res.cloudinary.com avatar.vercel.sh;",
      "font-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      "frame-ancestors 'none';",
      // Only upgrade in production
      isProduction ? "upgrade-insecure-requests;" : "",
      "worker-src 'self' blob:;",
      "connect-src 'self' ws://localhost:* wss://localhost:*;",
    ].join(" ");

    const headersList = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "origin-when-cross-origin",
      },
      {
        key: "Content-Security-Policy",
        value: csp,
      },
      {
        key: "Permissions-Policy",
        value: "camera=self, microphone=(), geolocation=()",
      },
    ];

    if (isProduction) {
      headersList.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: headersList,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "35mb",
      allowedOrigins: [
        "localhost:3000",
        (process.env.NEXT_PUBLIC_BASE_URL || "")?.replace(/^https?:\/\//, ""),
      ],
    },
  },
};

export default withPWA(withNextIntl(nextConfig));
