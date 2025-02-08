/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development
  buildExcludes: [/middleware-manifest\.json$/], // Exclude middleware manifest
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "video-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
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
  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  // Remove invalid experimental option
  // experimental: {
  //   staticPageGenerationTimeout: 300,
  // },
};

module.exports = withPWA(nextConfig);
