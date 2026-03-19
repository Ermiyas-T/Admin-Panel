import { AppAbility, defineAbilityFor } from "@/lib/ability/ability";
import { LoginResponse, User } from "@/types";

/**
 * We keep all auth-related storage keys in one place so the API layer,
 * Zustand store, and Axios client all agree on the same names.
 */
export const AUTH_STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  legacyAccessToken: "token",
  user: "user",
  permissions: "permissions",
} as const;

export interface AuthSnapshot {
  user: User | null;
  permissions: string[];
  ability: AppAbility | null;
}

export const emptyAuthSnapshot: AuthSnapshot = {
  user: null,
  permissions: [],
  ability: null,
};

const createAbility = (permissions: string[]) =>
  permissions.length ? defineAbilityFor(permissions) : null;

/**
 * Build the in-memory auth shape the UI needs from the user record and
 * permission strings we already persisted.
 */
export const createAuthSnapshot = (
  user: User | null,
  permissions: string[] = user?.permissions ?? [],
): AuthSnapshot => ({
  user,
  permissions,
  ability: createAbility(permissions),
});

/**
 * Read the previously saved session from localStorage.
 *
 * We wrap JSON parsing in a try/catch so a corrupted localStorage value does
 * not break the whole app on every page load.
 */
export const readStoredAuth = (): AuthSnapshot => {
  if (typeof window === "undefined") {
    return emptyAuthSnapshot;
  }

  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    const storedPermissions = localStorage.getItem(AUTH_STORAGE_KEYS.permissions);

    const user = storedUser ? (JSON.parse(storedUser) as User) : null;
    const permissions = storedPermissions
      ? (JSON.parse(storedPermissions) as string[])
      : user?.permissions ?? [];

    return createAuthSnapshot(user, permissions);
  } catch {
    clearPersistedAuth();
    return emptyAuthSnapshot;
  }
};

/**
 * Save the session returned by the backend in one place so every auth entry
 * point uses the same persistence logic.
 */
export const persistAuthSession = ({
  accessToken,
  refreshToken,
  user,
}: Pick<LoginResponse, "accessToken" | "refreshToken" | "user">) => {
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.legacyAccessToken, accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.setItem(
    AUTH_STORAGE_KEYS.permissions,
    JSON.stringify(user.permissions ?? []),
  );
};

export const clearPersistedAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.legacyAccessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
};
