import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com', 'https://meal-mesh.vercel.app'],
  },
  allowedDevOrigins: ['https://meal-mesh.vercel.app'],
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'fs/promises': false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;