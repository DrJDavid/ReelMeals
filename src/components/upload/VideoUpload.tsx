"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { uploadVideo, VideoUploadError } from "@/lib/services/video-upload";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UploadState {
  status: "idle" | "uploading" | "success" | "error" | "invalid";
  progress: number;
  message?: string;
  confidence?: number;
  fileSize?: number;
  errorCode?: string;
}

export function VideoUpload() {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Start upload
    setUploadState({
      status: "uploading",
      progress: 0,
      fileSize: file.size,
    });

    try {
      const result = await uploadVideo(file, user.uid, (progress) => {
        setUploadState((prev) => ({ ...prev, progress }));
      });

      if (!result.preScreeningResult?.isValid) {
        setUploadState({
          status: "invalid",
          progress: 100,
          message:
            result.preScreeningResult?.reason ||
            "Video is not a valid cooking video",
          confidence: result.preScreeningResult?.confidence,
          fileSize: file.size,
        });
        return;
      }

      setUploadState({
        status: "success",
        progress: 100,
        message: "Video uploaded successfully! Processing will begin shortly.",
        confidence: result.preScreeningResult?.confidence,
        fileSize: file.size,
      });
    } catch (error) {
      console.error("Upload error:", error);

      if (error instanceof VideoUploadError) {
        const errorMessage = getErrorMessage(error.code);
        setUploadState({
          status: "error",
          progress: 0,
          message: errorMessage,
          errorCode: error.code,
        });
      } else {
        setUploadState({
          status: "error",
          progress: 0,
          message:
            error instanceof Error ? error.message : "Failed to upload video",
        });
      }
    }
  };

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case "NO_FILE":
        return "Please select a file to upload.";
      case "NO_USER_ID":
        return "You must be logged in to upload videos.";
      case "FILE_TOO_LARGE":
        return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`;
      case "INVALID_FILE_TYPE":
        return "Invalid file type. Please upload a valid video file (MP4, MOV, or AVI).";
      case "FIREBASE_NOT_INITIALIZED":
        return "Upload service is temporarily unavailable. Please try again later.";
      case "UPLOAD_CANCELED":
        return "Upload was canceled.";
      case "UNAUTHORIZED":
        return "You are not authorized to upload videos.";
      case "UPLOAD_FAILED":
        return "Failed to upload video after multiple attempts. Please try again.";
      case "DOCUMENT_CREATION_FAILED":
        return "Failed to save video information. Please try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
          uploadState.status === "uploading"
            ? "border-primary-500 bg-primary-500/10"
            : uploadState.status === "success"
            ? "border-green-500 bg-green-500/10"
            : uploadState.status === "error"
            ? "border-red-500 bg-red-500/10"
            : uploadState.status === "invalid"
            ? "border-yellow-500 bg-yellow-500/10"
            : "border-gray-600 hover:border-primary-500 hover:bg-primary-500/10"
        } transition-all duration-200`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadState.status === "uploading"}
        />

        <div className="space-y-4">
          {/* Icon */}
          {uploadState.status === "uploading" ? (
            <div className="mx-auto w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : uploadState.status === "success" ? (
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />
          ) : uploadState.status === "error" ? (
            <XCircleIcon className="w-12 h-12 text-red-500 mx-auto" />
          ) : uploadState.status === "invalid" ? (
            <ExclamationCircleIcon className="w-12 h-12 text-yellow-500 mx-auto" />
          ) : (
            <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto" />
          )}

          {/* Message */}
          <div className="text-center">
            {uploadState.status === "uploading" ? (
              <div className="space-y-2">
                <p className="text-primary-400">Uploading video...</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
                <p className="text-xs text-primary-400/80">
                  {Math.round(uploadState.progress)}% •{" "}
                  {uploadState.fileSize &&
                    (uploadState.fileSize / (1024 * 1024)).toFixed(1)}
                  MB
                </p>
              </div>
            ) : uploadState.status === "success" ? (
              <div className="space-y-1">
                <p className="text-green-400">{uploadState.message}</p>
                {uploadState.confidence && (
                  <p className="text-sm text-green-400/80">
                    Confidence: {Math.round(uploadState.confidence * 100)}%
                  </p>
                )}
              </div>
            ) : uploadState.status === "error" ? (
              <div className="space-y-1">
                <p className="text-red-400">{uploadState.message}</p>
                {uploadState.errorCode && (
                  <p className="text-sm text-red-400/80">
                    Error code: {uploadState.errorCode}
                  </p>
                )}
              </div>
            ) : uploadState.status === "invalid" ? (
              <div className="space-y-1">
                <p className="text-yellow-400">{uploadState.message}</p>
                {uploadState.confidence && (
                  <p className="text-sm text-yellow-400/80">
                    Confidence: {Math.round(uploadState.confidence * 100)}%
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-300">
                  Drag and drop a video or click to browse
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Only cooking videos will be accepted
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          Video Requirements:
        </h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Must show food preparation or cooking process</li>
          <li>• Should have clear steps or instructions</li>
          <li>• Should show ingredients being used</li>
          <li>• Must demonstrate cooking techniques</li>
          <li>• Maximum file size: {MAX_FILE_SIZE_MB}MB</li>
          <li>• Supported formats: MP4, MOV, AVI</li>
        </ul>
      </div>
    </div>
  );
}
