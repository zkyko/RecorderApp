/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.BASE_PATH || '/RecorderApp',
  assetPrefix: process.env.BASE_PATH || '/RecorderApp',
}

module.exports = nextConfig

