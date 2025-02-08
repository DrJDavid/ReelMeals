"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Logo } from "@/components/Logo";
import { NavBar } from "@/components/NavBar";
import { VideoUpload } from "@/components/upload/VideoUpload";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white pb-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Logo className="mb-4" />
            <h1 className="text-2xl font-bold">Upload Recipe Video</h1>
            <p className="text-gray-400 mt-2">
              Share your cooking expertise with the community. Only high-quality
              cooking videos will be accepted.
            </p>
          </div>

          {/* Upload Component */}
          <VideoUpload />
        </div>

        <NavBar />
      </div>
    </ProtectedRoute>
  );
}
