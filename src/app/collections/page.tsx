"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CollectionsPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Your Collections</h1>
        <div className="text-center text-gray-400">
          <p>Collections feature coming soon!</p>
        </div>
      </main>
    </ProtectedRoute>
  );
}
