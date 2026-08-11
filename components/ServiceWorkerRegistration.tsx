"use client";

import { useEffect } from "react";

// Registers the offline-shell service worker (public/sw.js). Production only:
// in dev a stale cached shell just gets in the way of hot reloading.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}
