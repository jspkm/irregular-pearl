"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  onAuthChange,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  updateUserProfile,
} from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authError: null,
  signInGoogle: async () => {},
  signInEmail: async () => {},
  signUpEmail: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignInGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Google sign-in failed";
      setAuthError(msg);
    }
  };

  const handleSignInEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmail(email, password);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Email sign-in failed";
      setAuthError(msg);
    }
  };

  const handleSignUpEmail = async (email: string, password: string, displayName?: string) => {
    setAuthError(null);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Sign-up failed";
      setAuthError(msg);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Sign-out failed";
      setAuthError(msg);
    }
  };

  const handleUpdateProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    setAuthError(null);
    try {
      await updateUserProfile(updates);
      // Force re-render with updated user data
      if (user) {
        setUser({ ...user } as User);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Profile update failed";
      setAuthError(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signInGoogle: handleSignInGoogle,
        signInEmail: handleSignInEmail,
        signUpEmail: handleSignUpEmail,
        signOut: handleSignOut,
        updateProfile: handleUpdateProfile,
        clearError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

