"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Box, Typography } from "@mui/material";
import Lottie from "lottie-react";
import loadingAnimation from "@/assets/pesawatloading.json";

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  /** Panggil untuk refresh data user dari Firebase (mis. setelah verifikasi email) */
  reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  reloadUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Refresh status user dari Firebase (terutama emailVerified).
   * Setelah reload(), kita spread object user agar React mendeteksi perubahan.
   */
  const reloadUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      // Spread agar React melihat object baru dan re-render
      setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: 2 }}>
        <Lottie loop animationData={loadingAnimation} style={{ height: "200px", width: "200px" }} />
        <Typography variant="body1" color="textSecondary">Sabar yahh masi loading...</Typography>
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

