import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["onnxruntime-node", "@xenova/transformers"],
  },
};

export default nextConfig;
