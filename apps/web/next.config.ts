import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for the production container.
  output: "standalone",
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
