/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // PDF.js worker configuration
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
