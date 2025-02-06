import { AuthProvider } from "@/features/auth/AuthContext";
import { VideoModalProvider } from "@/features/video/VideoModalContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReelMeals",
  description: "Discover cooking videos through intuitive swipes",
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  themeColor: "#000000",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReelMeals",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/icon-192x192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/icons/icon-512x512.png"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${inter.className} h-full bg-gray-900 text-white antialiased`}
      >
        <AuthProvider>
          <VideoModalProvider>{children}</VideoModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
