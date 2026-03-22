import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production
  reactStrictMode: true,

  // Reduce serverless function size
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
    ],
  },

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  },
};

export default nextConfig;
// Force rebuild Sun Jan 25 18:10:09 UTC 2026
// Trigger redeploy Sun Mar 22 16:56:16 CDT 2026
