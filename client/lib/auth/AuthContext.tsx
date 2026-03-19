"use client";

import React from "react";
import { AuthHydrator } from "@/lib/auth/AuthHydrator";
import { useAuth } from "@/lib/auth/use-auth-store";

/**
 * Legacy compatibility bridge.
 *
 * The app now uses Zustand for auth/global state access instead of React context.
 * We keep this file so older imports do not break immediately while new code
 * moves to `@/lib/auth/auth-store`.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <>
    <AuthHydrator />
    {children}
  </>
);

export { useAuth };
