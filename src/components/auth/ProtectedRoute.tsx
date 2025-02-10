"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && !isRedirecting) {
      console.log("No authenticated user found, redirecting to login...");
      setIsRedirecting(true);
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/auth/login?returnUrl=${returnUrl}`);
    }
  }, [user, loading, router, pathname, isRedirecting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <div className="mt-4 text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <div className="mt-4 text-white">Redirecting...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
