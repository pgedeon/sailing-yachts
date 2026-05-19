const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/**
 * Image remote patterns — explicit allowlist of all external image sources.
 * Replaces the previous hostname wildcard for better security and
 * to let Next.js Image Optimization proxy these domains correctly.
 */
const imageRemotePatterns = [
  // Stock / community photos
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "images.boats.com" },
  { protocol: "https", hostname: "images.boatsgroup.com" },

  // Spec aggregator sites
  { protocol: "https", hostname: "www.boat-specs.com" },
  { protocol: "https", hostname: "sailboatdata.com" },
  { protocol: "https", hostname: "itboat.ams3.digitaloceanspaces.com" },

  // Yacht brokerage / listing platforms
  { protocol: "https", hostname: "**.yachtworld.com" },
  { protocol: "https", hostname: "frg-fps.azurewebsites.net" },

  // Manufacturer sites — Beneteau Group
  { protocol: "https", hostname: "www.beneteau.com" },
  { protocol: "https", hostname: "app.jeanneau.com" },
  { protocol: "https", hostname: "www.jeanneau.com" },
  { protocol: "https", hostname: "admin.catamarans-lagoon.com" },

  // Manufacturer sites — others
  { protocol: "https", hostname: "www.bavariayachts.com" },
  { protocol: "https", hostname: "www.dufour-yachts.com" },
  { protocol: "https", hostname: "media.elan-yachts.com" },
  { protocol: "https", hostname: "www.hallberg-rassy.com" },
  { protocol: "https", hostname: "www.nautorswan.com" },
  { protocol: "https", hostname: "www.x-yachts.com" },
  { protocol: "https", hostname: "www.wauquiez.com" },
  { protocol: "https", hostname: "www.grandsoleil.net" },
  { protocol: "https", hostname: "www.solarisyachts.com" },
  { protocol: "https", hostname: "www.rm-yachts.com" },
  { protocol: "https", hostname: "www.sirius-yachts.com" },
  { protocol: "https", hostname: "www.neel-trimarans.com" },
  { protocol: "https", hostname: "www.delphiayachts.com" },
  { protocol: "https", hostname: "www.catalinayachts.com" },

  // Smaller / niche builders
  { protocol: "https", hostname: "dragonfly.dk" },
  { protocol: "http", hostname: "dragonfly.dk" },
  { protocol: "https", hostname: "arconayachts.se" },
  { protocol: "https", hostname: "mylius.it" },
  { protocol: "https", hostname: "oysteryachts.com" },
  { protocol: "https", hostname: "saffieryachts.com" },
  { protocol: "https", hostname: "tartanyachts.com" },
  { protocol: "https", hostname: "jboats.com" },
  { protocol: "https", hostname: "amel.fr" },

  // CMS / CDN
  { protocol: "https", hostname: "a.storyblok.com" },
  { protocol: "https", hostname: "cdn.prod.website-files.com" },
  { protocol: "https", hostname: "vz-b5717c1c-a70.b-cdn.net" },
  { protocol: "https", hostname: "www.yachtbroker-charters.com" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: imageRemotePatterns,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async redirects() {
    return [
      // Common alternate names for the yacht listing page → redirect to /en locale
      {
        source: '/browse',
        destination: '/en/yachts',
        permanent: true,
      },
      {
        source: '/boats',
        destination: '/en/yachts',
        permanent: true,
      },
      {
        source: '/listings',
        destination: '/en/yachts',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // OpenAPI spec: serve /api/v1/openapi.json via the route at /api/v1/openapi
      {
        source: '/api/v1/openapi.json',
        destination: '/api/v1/openapi',
      },
    ];
  },
  async headers() {
    return [
      {
        // Security headers for admin pages and API routes
        source: '/admin/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

// Sentry wrapper — only applies when Sentry env vars are set
const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
};

// Chain: next-intl → Sentry (if configured) → raw config
let config = withNextIntl(nextConfig);

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  config = withSentryConfig(config, sentryConfig);
}

module.exports = config;
