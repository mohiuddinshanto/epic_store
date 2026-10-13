import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next.js 15 defaults dynamic Router Cache to 0, so every menu click and
    // back/forward re-fetches from the server. Keep dynamic pages for 30s and
    // static ones for 3min so navigation feels instant while staying fresh.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "cors",
    "express",
    "multer",
    "nodemailer",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "gadgetlagbe.online" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;