"use client";

import { useEffect } from "react";

export function ServiceWorkerKiller() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).workbox === undefined
    ) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          console.log("Unregistering Service Worker:", registration);
          registration.unregister();
        }
      });
    }
  }, []);

  return null;
}
