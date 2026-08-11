import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into `out/` — no Node.js server required.
  // This output is uploaded directly to the Amplify branch via S3 asset.
  output: "export",

  // Produce `about/index.html` instead of `about.html` so that Amplify can
  // resolve paths without extension rewriting.
  trailingSlash: true,
};

export default nextConfig;
