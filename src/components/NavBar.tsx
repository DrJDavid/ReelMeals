"use client";

import { useAuth } from "@/features/auth/AuthContext";
import {
  BookmarkIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around py-2">
          <Link
            href="/"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive("/")
                ? "text-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            href="/feed"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive("/feed")
                ? "text-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <PlayIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Feed</span>
          </Link>

          <Link
            href="/search"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive("/search")
                ? "text-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Search</span>
          </Link>

          <Link
            href="/collections"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive("/collections")
                ? "text-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <BookmarkIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Collections</span>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive("/profile")
                ? "text-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <UserCircleIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
