import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image Optimization Pipeline
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/electronics/gadgets',
        destination: '/electronics',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
