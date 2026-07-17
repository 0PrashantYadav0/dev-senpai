import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@splinetool/react-spline", "@splinetool/runtime"],
  experimental: {
    serverComponentsExternalPackages: ["onnxruntime-node", "@xenova/transformers"],
  },
};

export default nextConfig;
