import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build enxuto para rodar em container (EasyPanel na Hostinger)
  output: "standalone",
  // so usamos imagens locais pequenas (logo); evita depender do sharp no container
  images: { unoptimized: true },
  experimental: {
    serverActions: {
      // padrao (1mb) e pequeno demais para importar um .docx/.pdf
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
