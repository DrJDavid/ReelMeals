"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { NavBar } from "@/components/NavBar";
import { VideoCard } from "@/components/video/VideoCard";
import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreUser, FirestoreVideo } from "@/lib/firebase/firestore-schema";
import {
  createUser,
  getSavedVideoIds,
  getUser,
  getVideosByUser,
  updateUser,
} from "@/lib/firebase/firestore-service";
import { firebaseStorage } from "@/lib/firebase/initFirebase";
import { PencilIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [likedVideosCount, setLikedVideosCount] = useState(0);
  const [totalLikesReceived, setTotalLikesReceived] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState<FirestoreVideo[]>([]);
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        setIsIndexBuilding(false);

        // Get user profile data
        const userData = await getUser(user.uid);
        if (userData) {
          setDisplayName(userData.displayName || "");
          setProfilePicture(userData.photoURL || null);
        }

        // Get liked videos count
        const savedVideoIds = await getSavedVideoIds(user.uid);
        setLikedVideosCount(savedVideoIds.length);

        try {
          // Get user's uploaded videos
          const videos = await getVideosByUser(user.uid);
          setUploadedVideos(videos);

          // Calculate total likes received
          const totalLikes = videos.reduce(
            (sum, video) => sum + (video.likes || 0),
            0
          );
          setTotalLikesReceived(totalLikes);
        } catch (err) {
          // Check if the error is due to missing index
          if (err instanceof Error && err.message.includes("index")) {
            setIsIndexBuilding(true);
            console.log("Index is being built, please wait...");
          } else {
            throw err;
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load user data")
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firebaseStorage) return;

    try {
      setUploadingImage(true);
      setError(null);

      // Upload image to storage
      const storageRef = ref(firebaseStorage, `profile-pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Get current user data
      let userData = await getUser(user.uid);

      if (!userData) {
        // Create user document if it doesn't exist
        const newUserData: Omit<FirestoreUser, "id"> = {
          email: user.email || "",
          displayName: displayName,
          photoURL: downloadURL,
        };
        await createUser(user.uid, newUserData);
      } else {
        // Update existing user document
        await updateUser(user.uid, {
          photoURL: downloadURL,
        });
      }

      setProfilePicture(downloadURL);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to upload image")
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      setError(null);
      if (!displayName.trim()) {
        throw new Error("Username cannot be empty");
      }

      // Get current user data
      let userData = await getUser(user.uid);

      if (!userData) {
        // Create user document if it doesn't exist
        const newUserData: Omit<FirestoreUser, "id"> = {
          email: user.email || "",
          displayName: displayName.trim(),
        };
        await createUser(user.uid, newUserData);
      } else {
        // Update existing user document
        await updateUser(user.uid, {
          displayName: displayName.trim(),
        });
      }

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to update profile")
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white pb-20">
        {/* Profile Content */}
        <div className="px-4 py-8 max-w-md mx-auto">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-8">
              {/* Profile Picture */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-full h-full text-gray-600" />
                )}
                <label className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors">
                  <PencilIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Username/Email */}
              {isEditing ? (
                <div className="space-y-4 mb-4">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={handleProfileUpdate}
                      className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-1">
                    {displayName || "Set username"}
                  </h1>
                  <p className="text-gray-400 text-sm mb-2">{user?.email}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Edit Profile
                  </button>
                </>
              )}
              <p className="text-gray-400 text-sm">
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
                    <div className="text-2xl font-bold">{likedVideosCount}</div>
                    <div className="text-gray-400">Liked Videos</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <div className="text-2xl font-bold">
                      {totalLikesReceived}
                    </div>
                    <div className="text-gray-400">Likes Received</div>
                  </div>
                </div>
              </div>

              {/* User's Uploaded Videos */}
              <div className="border-t border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4">Your Videos</h2>
                {loading ? (
                  <div className="text-center text-gray-400">
                    Loading videos...
                  </div>
                ) : isIndexBuilding ? (
                  <div className="text-center text-yellow-400 space-y-2">
                    <p>Setting up video indexing...</p>
                    <p className="text-sm text-gray-400">
                      This may take a few minutes. Please refresh the page
                      shortly.
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-400">
                    {error.message}
                  </div>
                ) : uploadedVideos.length === 0 ? (
                  <div className="text-center text-gray-400">
                    You haven't uploaded any videos yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {uploadedVideos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <NavBar />
      </div>
    </ProtectedRoute>
  );
}
