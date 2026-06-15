import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server external packages for Prisma
  serverExternalPackages: ["@prisma/client", "@neondatabase/serverless"],
  
  // Transpile React Flow for proper ESM handling
  transpilePackages: ["@xyflow/react", "@xyflow/system"],

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
