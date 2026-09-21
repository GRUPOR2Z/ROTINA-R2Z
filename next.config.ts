import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // padrao (1mb) e pequeno demais para importar um .docx/.pdf
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
