"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { SemesterProvider } from "@/context/SemesterContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <AuthProvider>
          <SemesterProvider>{children}</SemesterProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
