import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wesleypaul.org",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "wesleypaul.org",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
