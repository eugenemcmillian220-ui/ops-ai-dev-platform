import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove static export for production (needed for API routes)
  // output: 'export',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
