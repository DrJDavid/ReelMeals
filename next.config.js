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
  output: "export", // Changed from 'standalone' to 'export' for static generation
  distDir: "www", // This will output to the 'www' directory that Capacitor expects
  // Disable server-specific features
  trailingSlash: true,
};

module.exports = withPWA(nextConfig);
