import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Importar planillas: Vercel acepta hasta 4,5 MB por pedido.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
