const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    instrumentationHook: true,
  },
  images: { remotePatterns: [{ hostname: '**' }] },
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
