"use client";

import Link from "next/link";

export function GuestBanner() {
  return (
    <div className="fixed top-16 left-0 right-0 bg-primary-600 text-white px-4 py-3 text-center z-40">
      <p className="text-sm">
        <Link
          href="/auth/login"
          className="font-semibold underline hover:text-white/80"
        >
          Sign in
        </Link>{" "}
        or{" "}
        <Link
          href="/auth/signup"
          className="font-semibold underline hover:text-white/80"
        >
          create an account
        </Link>{" "}
        to save videos and create collections
      </p>
    </div>
  );
}
