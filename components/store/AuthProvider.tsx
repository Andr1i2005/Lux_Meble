"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, firebaseEnabled } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  ready: boolean;        // auth state resolved
  enabled: boolean;      // firebase configured
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // When Firebase isn't configured we're "ready" immediately (guest mode).
  const [ready, setReady] = useState(!firebaseEnabled);

  useEffect(() => {
    // When disabled, `ready` already starts true (guest mode) — nothing to do.
    if (!firebaseEnabled || !auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  const value: AuthContextValue = {
    user,
    ready,
    enabled: firebaseEnabled,
    signInWithGoogle: async () => {
      await signInWithPopup(auth!, googleProvider);
    },
    signOut: async () => {
      await fbSignOut(auth!);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
