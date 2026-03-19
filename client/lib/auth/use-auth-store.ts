"use client";

import { useRouter } from "next/navigation";
import { create } from "zustand";
import { login as apiLogin } from "@/lib/api/auth";
import {
  clearPersistedAuth,
  createAuthSnapshot,
  emptyAuthSnapshot,
  readStoredAuth,
} from "@/lib/auth/auth-session-storage";
import { AppAbility } from "@/lib/ability/ability";
import { User } from "@/types";

interface AuthStoreState {
  user: User | null;
  permissions: string[];
  ability: AppAbility | null;
  isLoading: boolean;
  hydrateFromStorage: () => void;
  setSession: (user: User | null, permissions?: string[]) => void;
  clearSession: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/**
 * Zustand gives us a single global store without a provider.
 *
 * Think of this file as the home for the auth Zustand hooks:
 * - state (`user`, `permissions`, `ability`, `isLoading`)
 * - actions (`login`, `logout`, `hydrateFromStorage`)
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  ...emptyAuthSnapshot,
  isLoading: true,

  hydrateFromStorage: () => {
    set({
      ...readStoredAuth(),
      isLoading: false,
    });
  },

  setSession: (user, permissions = user?.permissions ?? []) => {
    set({
      ...createAuthSnapshot(user, permissions),
      isLoading: false,
    });
  },

  clearSession: () => {
    clearPersistedAuth();
    set({
      ...emptyAuthSnapshot,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    const data = await apiLogin(email, password);

    set({
      ...createAuthSnapshot(data.user, data.user.permissions ?? []),
      isLoading: false,
    });
  },

  logout: () => {
    clearPersistedAuth();
    set({
      ...emptyAuthSnapshot,
      isLoading: false,
    });
  },
}));

/**
 * `useAuth` stays as the beginner-friendly API the rest of the app consumes.
 *
 * Components do not need to know about `useRouter` or Zustand internals.
 * They can still say:
 * - `const { user } = useAuth()`
 * - `await login(email, password)`
 * - `logout()`
 */
export const useAuth = () => {
  const router = useRouter();
  const auth = useAuthStore();

  const login = async (email: string, password: string) => {
    await auth.login(email, password);
    router.push("/dashboard");
  };

  const logout = () => {
    auth.logout();
    router.push("/login");
  };

  return {
    ...auth,
    login,
    logout,
  };
};
