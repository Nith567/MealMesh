import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com', 'https://f731-2a09-bac1-36e0-1468-00-1c5-52.ngrok-free.app'],
  },
  allowedDevOrigins: ['https://f731-2a09-bac1-36e0-1468-00-1c5-52.ngrok-free.app'],
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