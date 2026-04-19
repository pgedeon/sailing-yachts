const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    instrumentationHook: true,
  },
  images: { remotePatterns: [{ hostname: '**' }] },
  async redirects() {
    return [
      // Common alternate names for the yacht listing page
      {
        source: '/browse',
        destination: '/yachts',
        permanent: true, // 301
      },
      {
        source: '/boats',
        destination: '/yachts',
        permanent: true,
      },
      {
        source: '/listings',
        destination: '/yachts',
        permanent: true,
      },
    ];
  },
};

// Sentry wrapper — only applies when Sentry env vars are set
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: true,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (not dist)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in Sentry
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // (not needed if the DSN is on the same domain)
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router)
  // automaticVercelMonitors: true,
};

// Only wrap with Sentry if the DSN is configured
const moduleExports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;

module.exports = moduleExports;
