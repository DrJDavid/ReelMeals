import { AuthProvider } from "@/features/auth/AuthContext";
import { VideoModalProvider } from "@/features/video/VideoModalContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReelMeals",
  description: "Discover cooking videos through intuitive swipes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
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
