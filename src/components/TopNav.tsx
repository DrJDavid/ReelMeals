"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-white">
            ReelMeals
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/feed"
              className={`text-sm transition-colors ${
                isActive("/feed")
                  ? "text-white font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Feed
            </Link>
            <Link
              href="/collections"
              className={`text-sm transition-colors ${
                isActive("/collections")
                  ? "text-white font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Collections
            </Link>
            <Link
              href="/profile"
              className={`text-sm transition-colors ${
                isActive("/profile")
                  ? "text-white font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
