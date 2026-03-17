"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin } from "@/lib/api/auth";
import { defineAbilityFor, AppAbility } from "@/lib/ability/ability";
import { User } from "@/types";

/**
 * AuthContext keeps the authenticated user's info in React state so any component
 * can access it (user, permissions, and the CASL `ability` instance).
 *
 * Important storage keys used across the app:
 * - `accessToken`: short-lived JWT used in `Authorization: Bearer ...` headers
 * - `refreshToken`: long-lived token used to get a new access token
 * - `token`: legacy alias for `accessToken` (kept for backward compatibility)
 * - `user`: JSON string of the current user object
 * - `permissions`: JSON string array like ["read:Post", "delete:User"]
 *
 * Where tokens are actually attached / refreshed:
 * - `lib/api/client.ts` is responsible for:
 *   - attaching the access token to requests
 *   - auto-refreshing when a request gets a 401 response
 *
 * Where tokens are persisted on login:
 * - `lib/api/auth.ts` persists tokens/user/permissions into localStorage after login.
 */
interface AuthContextType {
  user: User | null;
  permissions: string[];
  ability: AppAbility | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Reads the current auth state from localStorage.
 *
 * This runs only in the browser (this file is a Client Component) and is used as
 * the lazy initializer for React state to avoid:
 * - "setState inside useEffect" lint warnings
 * - an extra render pass on first load
 */
const readStoredAuth = (): {
  user: User | null;
  permissions: string[];
  ability: AppAbility | null;
} => {
  if (typeof window === "undefined") {
    return { user: null, permissions: [], ability: null };
  }

  try {
    const storedUser = localStorage.getItem("user");
    const storedPermissions = localStorage.getItem("permissions");

    const user = storedUser ? (JSON.parse(storedUser) as User) : null;
    const permissions = storedPermissions
      ? (JSON.parse(storedPermissions) as string[])
      : user?.permissions ?? [];

    const ability = permissions.length ? defineAbilityFor(permissions) : null;

    return { user, permissions, ability };
  } catch {
    // If stored JSON is corrupted (or user manually edited localStorage),
    // clearing it avoids breaking the app on every page load.
    localStorage.clear();
    return { user: null, permissions: [], ability: null };
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // We initialize from localStorage once, on first render.
  // After that, we keep state updated when login/logout happens.
  const [user, setUser] = useState<User | null>(() => readStoredAuth().user);
  const [permissions, setPermissions] = useState<string[]>(
    () => readStoredAuth().permissions,
  );
  const [ability, setAbility] = useState<AppAbility | null>(
    () => readStoredAuth().ability,
  );
  const router = useRouter();

  /**
   * Logs in through the API and updates React state.
   *
   * Note: the API helper (`apiLogin`) is the one that persists tokens/user data into localStorage.
   * This keeps responsibilities separated:
   * - API layer: talks to backend + persists session
   * - Context: holds in-memory state for React components
   */
  const login = async (email: string, password: string) => {
    try {
      const data = await apiLogin(email, password);

      // `apiLogin` already persists tokens/user/permissions to localStorage.
      // Here we just update in-memory state used by React components.
      const nextPermissions = data.user.permissions ?? [];
      setUser(data.user);
      setPermissions(nextPermissions);
      setAbility(defineAbilityFor(nextPermissions));
      router.push("/dashboard"); // Redirect after login
    } catch (error) {
      // Handle error (show message to user)
      throw error;
    }
  };

  /**
   * Clears localStorage and in-memory auth state.
   *
   * We also remove both new keys (`accessToken`, `refreshToken`) and the legacy `token` key.
   * After logout, any protected API call will behave as unauthenticated.
   */
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    setUser(null);
    setPermissions([]);
    setAbility(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, permissions, ability, login, logout, isLoading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
