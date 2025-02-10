"use client";

import { FirestoreUser } from "@/lib/firebase/firestore-schema";
import { createUser } from "@/lib/firebase/firestore-service";
import { firebaseAuth } from "@/lib/firebase/initFirebase";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {
    throw new Error("AuthContext not initialized");
  },
  signIn: async () => {
    throw new Error("AuthContext not initialized");
  },
  signInWithGoogle: async () => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {
    throw new Error("AuthContext not initialized");
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!firebaseAuth) {
      console.error("Firebase Auth not initialized");
      setLoading(false);
      return;
    }

    // Set loading to true when auth state changes
    setLoading(true);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (user) {
          // Create user in Firestore if they don't exist
          const userData: Omit<FirestoreUser, "id"> = {
            email: user.email || "",
            displayName: user.displayName || user.email || "Anonymous User",
            photoURL: user.photoURL || undefined,
          };
          await createUser(user.uid, userData);
        }
        setUser(user);
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    // Clean up subscription
    return () => {
      unsubscribe();
      setInitialized(false);
    };
  }, []);

  // Don't render children until Firebase Auth is initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <div className="mt-4 text-white">Initializing...</div>
        </div>
      </div>
    );
  }

  const signUp = async (email: string, password: string): Promise<User> => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    return credential.user;
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    return credential.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(firebaseAuth, provider);
    return credential.user;
  };

  const logout = async (): Promise<void> => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }
    await signOut(firebaseAuth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signInWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
