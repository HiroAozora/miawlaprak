"use client";

import React, { createContext, useState, useMemo, useEffect, ReactNode } from "react";
import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

interface ThemeContextType {
  toggleTheme: () => void;
  mode: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextType>({
  toggleTheme: () => {},
  mode: "dark",
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("theme");
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", mode);
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode,
        },
        typography: {
          fontFamily: '"Poppins", sans-serif',
          h4: {
            fontSize: "1.75rem",
            "@media (max-width:600px)": { fontSize: "1.4rem" },
            fontWeight: 500,
          },
          h5: {
            fontSize: "1.25rem",
            "@media (max-width:600px)": { fontSize: "1.1rem" },
            fontWeight: 500,
          },
          h6: {
            fontSize: "1.1rem",
            "@media (max-width:600px)": { fontSize: "1.0rem" },
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 16,
        },
      }),
    [mode]
  );

  // Jangan render anak-anak sampai kita tahu theme apa yang dipakai di sisi klien (hydration fix)
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
