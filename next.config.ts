import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker: self-contained server bundle. Vercel builds its own output.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@libsql/client", "libsql"],
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
};

export default nextConfig;
