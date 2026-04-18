/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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

module.exports = nextConfig;
