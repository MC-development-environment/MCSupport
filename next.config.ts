import createNextIntlPlugin from "next-intl/plugin";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false, // Habilitar en desarrollo para pruebas
});

const withNextIntl = createNextIntlPlugin();

import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: import("next").NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    (process.env.NEXT_PUBLIC_BASE_URL || "")?.replace(/^https?:\/\//, ""),
    ".trycloudflare.com", // Dominio para el tunel
  ],
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
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
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
              "style-src 'self' 'unsafe-inline';",
              "img-src 'self' blob: data: res.cloudinary.com;",
              "font-src 'self';",
              "object-src 'none';",
              "base-uri 'self';",
              "form-action 'self';",
              "frame-ancestors 'none';",
              "upgrade-insecure-requests;",
              "worker-src 'self' blob:;",
              "connect-src 'self' https://*.ingest.us.sentry.io https://*.sentry.io ws://localhost:* wss://localhost:*;",
            ].join(" "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=self, microphone=(), geolocation=()",
          },
        ],
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

export default withSentryConfig(withPWA(withNextIntl(nextConfig)), {
  // Para ver todas las opciones disponibles:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "multicomputos",
  project: "javascript-nextjs",

  // Solo imprimir logs de subida de source maps en CI
  silent: !process.env.CI,

  // Para ver todas las opciones disponibles:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Subir un conjunto más amplio de source maps para trazas más bonitas
  widenClientFileUpload: true,

  // Anotar automáticamente componentes React para mostrar nombres completos en breadcrumbs y replay
  reactComponentAnnotation: {
    enabled: true,
  },
});
