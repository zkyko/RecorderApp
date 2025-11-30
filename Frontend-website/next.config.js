// next.config.js
const isProd = process.env.NODE_ENV === 'production';
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/RecorderApp' : '',
  assetPrefix: isProd ? '/RecorderApp/' : '',
  webpack: (config, { isServer }) => {
    // Resolve modules from the project root and parent directories
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../node_modules'),
    ];
    return config;
  },
  typescript: {
    // Temporarily ignore build errors for shared UI files
    // These files are type-checked in their own project context
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

