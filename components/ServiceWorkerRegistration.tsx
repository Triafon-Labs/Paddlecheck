"use client";

import { useEffect } from "react";

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((registrationError) => {
            console.error("SW registration failed:", registrationError);
          });
      });
    }
  }, []);

  return null;
};

export default ServiceWorkerRegistration;
