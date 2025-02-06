/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],
    unoptimized: true, // Required for static export
  },
  output: "export", // Keep as 'export' for static site generation
  distDir: "www", // Keep the www directory for Capacitor
  // Disable server-specific features
  trailingSlash: true,
};

module.exports = withPWA(nextConfig);
