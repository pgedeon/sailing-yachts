/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Allow images from common yacht manufacturers and broker sites
      { hostname: "**" }, // For now allow all; later restrict to known domains
    ],
  },
};

module.exports = nextConfig;
