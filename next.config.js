/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow fs operations in API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('fs-extra');
    }
    return config;
  },
};

module.exports = nextConfig;
