"use client";

import { Logo } from "@/components/Logo";
import { useAuth } from "@/features/auth/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/feed";
  const { signIn, signInWithGoogle, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to feed");
      router.replace("/feed");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      router.replace(decodeURIComponent(returnUrl));
    } catch (err) {
      console.error("Error signing in:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred during sign in"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      router.replace(decodeURIComponent(returnUrl));
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred during sign in"
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't render the login form if already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="mb-8">
          <Logo className="mx-auto" />
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-8">
            Sign in to continue
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800/50 text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full px-4 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Signing in..." : "Sign in with Google"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-400">Don't have an account?</span>{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            <div className="mt-4">Loading...</div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
