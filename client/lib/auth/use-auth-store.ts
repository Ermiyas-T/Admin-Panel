"use client";

import { useRouter } from "next/navigation";
import { create } from "zustand";
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
} from "@/lib/api/auth";
import { AppAbility, defineAbilityFor } from "@/lib/ability/ability";
import { AuthenticatedUser, User } from "@/types";

interface AuthStateSnapshot {
  user: User | null;
  permissions: string[];
  ability: AppAbility | null;
}

const emptyAuthSnapshot: AuthStateSnapshot = {
  user: null,
  permissions: [],
  ability: null,
};

const createAbility = (permissions: string[]) =>
  permissions.length ? defineAbilityFor(permissions) : null;

const createAuthSnapshot = (
  user: AuthenticatedUser | null,
  permissions: string[] = user?.permissions ?? [],
): AuthStateSnapshot => ({
  user,
  permissions,
  ability: createAbility(permissions),
});

interface AuthStoreState {
  user: User | null;
  permissions: string[];
  ability: AppAbility | null;
  isLoading: boolean;
  hydrateFromServer: () => Promise<void>;
  setSession: (user: AuthenticatedUser | null, permissions?: string[]) => void;
  clearSession: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Zustand gives us a single global store without a provider.
 *
 * Think of this file as the home for the auth Zustand hooks:
 * - state (`user`, `permissions`, `ability`, `isLoading`)
 * - actions (`login`, `logout`, `hydrateFromServer`)
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  ...emptyAuthSnapshot,
  isLoading: true,

  hydrateFromServer: async () => {
    try {
      const user = await getCurrentUser();

      set({
        ...createAuthSnapshot(user, user.permissions ?? []),
        isLoading: false,
      });
    } catch {
      set({
        ...emptyAuthSnapshot,
        isLoading: false,
      });
    }
  },

  setSession: (user, permissions = user?.permissions ?? []) => {
    set({
      ...createAuthSnapshot(user ? { ...user, permissions } : null, permissions),
      isLoading: false,
    });
  },

  clearSession: () => {
    set({
      ...emptyAuthSnapshot,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    const data = await apiLogin(email, password);

    set({
      ...createAuthSnapshot(data.user, data.user.permissions),
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      set({
        ...emptyAuthSnapshot,
        isLoading: false,
      });
    }
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

  const logout = async () => {
    await auth.logout();
    router.push("/login");
  };

  return {
    ...auth,
    login,
    logout,
  };
};
