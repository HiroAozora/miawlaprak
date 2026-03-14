"use client";

import { useEffect } from "react";

/**
 * Komponen ini mendaftarkan service worker untuk PWA.
 * Dirender di root layout, tidak menghasilkan UI apapun.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("[SW] Registered:", reg.scope))
          .catch((err) => console.warn("[SW] Registration failed:", err));
      });
    }
  }, []);

  return null;
}
