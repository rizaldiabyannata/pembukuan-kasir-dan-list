/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Disable React Compiler for now due to memoization warnings
  // Can be re-enabled once hooks are optimized for the compiler
  reactCompiler: false,
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Set explicit turbopack root
  turbopack: {
    root: process.cwd(),
  },
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  // Security headers handled by proxy.js
};

export default nextConfig;
