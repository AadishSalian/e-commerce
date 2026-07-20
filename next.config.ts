import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
