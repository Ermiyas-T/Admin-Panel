"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth/use-auth-store";

/**
 * Zustand does not need a provider, but we still need one browser-only place
 * to pull any saved session data out of localStorage after the app mounts.
 */
export const AuthHydrator = () => {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }

    hasHydratedRef.current = true;
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return null;
};
