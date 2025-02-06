"use client";

import Link from "next/link";

export function GuestBanner() {
  return (
    <div className="bg-primary-500/10 border-b border-primary-500/20 py-2 px-4">
      <div className="max-w-7xl mx-auto text-center text-sm">
        <span className="text-primary-300">
          Sign in to save videos to your collections!{" "}
        </span>
        <Link
          href="/auth/login"
          className="text-primary-500 hover:text-primary-400 font-medium"
        >
          Log in
        </Link>
        <span className="text-primary-300"> or </span>
        <Link
          href="/auth/signup"
          className="text-primary-500 hover:text-primary-400 font-medium"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
