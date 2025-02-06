"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { NavBar } from "@/components/NavBar";
import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white pb-20">
        {/* Profile Content */}
        <div className="px-4 py-8 max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">
                  {user?.email?.[0].toUpperCase() || "?"}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{user?.email}</h1>
              <p className="text-gray-400">
                Member since {user?.metadata.creationTime}
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-t border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
                <div className="space-y-4">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4">Stats</h2>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-700 p-4 rounded">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-gray-400">Liked Videos</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-gray-400">Collections</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <NavBar />
      </div>
    </ProtectedRoute>
  );
}
