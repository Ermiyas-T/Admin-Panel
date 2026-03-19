"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth/use-auth-store";

/**
 * Zustand does not need a provider, but we still need one startup component
 * to ask the backend whether the browser already has a valid auth cookie.
 */
export const AuthHydrator = () => {
  const hydrateFromServer = useAuthStore((state) => state.hydrateFromServer);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }

    hasHydratedRef.current = true;
    void hydrateFromServer();
  }, [hydrateFromServer]);

  return null;
};
