"use client";

import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreUser, withTimestamps } from "@/lib/firebase/firestore-schema";
import { createUser } from "@/lib/firebase/firestore-service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create Firebase auth user
      const user = await signUp(email, password);

      // Create Firestore user document
      if (user) {
        const userData: Omit<FirestoreUser, "id"> = withTimestamps({
          email: user.email || email,
          displayName,
        });

        await createUser(user.uid, userData);
        router.push("/feed");
      }
    } catch (err) {
      console.error("Error signing up:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred during sign up"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          ReelMeals
        </h1>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary-500 hover:text-primary-400"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <Alert type="error" message={error} />}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Sign Up
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
