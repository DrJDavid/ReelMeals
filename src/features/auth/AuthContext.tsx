"use client";

import { firebaseAuth } from "@/lib/firebase/initFirebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      setUser(result.user);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      setUser(result.user);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      setUser(result.user);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
    try {
      setError(null);
      await signOut(firebaseAuth);
      setUser(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
