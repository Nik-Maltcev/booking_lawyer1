import type { NextConfig } from "next";

// Use the stable Webpack builder; Turbopack currently chokes on Tailwind's Node
// dependencies during production builds (e.g. Railway). Removing the turbopack
// config forces Next.js to fall back to Webpack for reliable builds.
const nextConfig: NextConfig = {};

export default nextConfig;
