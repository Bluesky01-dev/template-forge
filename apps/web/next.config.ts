import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@tf/agent", "@tf/brand", "@tf/engine", "@tf/renderer", "@tf/schema", "@tf/sections", "@tf/templates", "@tf/tokens", "@tf/ui"],
  images: { unoptimized: true },
  agentRules: false,
};

export default nextConfig;

// Makes Cloudflare bindings (D1, env vars) available during `next dev`.
initOpenNextCloudflareForDev();
