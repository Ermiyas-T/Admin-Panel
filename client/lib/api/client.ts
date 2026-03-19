import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  AUTH_STORAGE_KEYS,
  clearPersistedAuth,
} from "@/lib/auth/auth-session-storage";

/**
 * This file creates a single, shared Axios instance (`apiClient`)
 * that the whole frontend uses to talk to the backend API.
 *
 * It adds three important behaviors on top of plain Axios:
 * 1. Automatically attaches the current access token to every request.
 * 2. When the backend says "401 Unauthorized" because the access token expired,
 *    it tries to get a new access token using the refresh token.
 * 3. If multiple requests fail at the same time while we are refreshing,
 *    it queues them and retries all of them after the refresh succeeds.
 */

// 1) Create a configured Axios instance
const apiClient = axios.create({
  // Base URL for all API requests. You can override this with NEXT_PUBLIC_API_URL
  // in your `.env` file. If it's not set, we fall back to the local dev API.
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * When a token is expired, many requests might fail with 401 at the same time.
 * We only want to call the `/auth/refresh` endpoint once, then re-use the
 * new access token for all those failed requests.
 *
 * `isRefreshing` tells us if a refresh call is already in progress.
 * `failedQueue` stores the promises for requests waiting for a new token.
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * After we finish refreshing (either successfully or with an error),
 * we go through `failedQueue`:
 * - if we got an error, we reject all waiting promises
 * - if we got a new token, we resolve them with that token
 */
const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Helper to read the current access token from localStorage.
 *
 * We prefer `accessToken`, but we also fall back to `token` to
 * keep compatibility with any older code that still uses that key.
 */
const getStoredAccessToken = () =>
  localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
  localStorage.getItem(AUTH_STORAGE_KEYS.legacyAccessToken);

/**
 * Call the backend to exchange the refresh token for a new access token.
 *
 * - Reads `refreshToken` from localStorage.
 * - Sends POST /auth/refresh with that token.
 * - Saves the new access token back to localStorage.
 *
 * Returns:
 * - the new access token string if everything worked
 * - `null` if something went wrong (no refresh token, network error, etc.)
 */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;

  try {
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    const { accessToken } = response.data as { accessToken?: string };

    if (!accessToken) return null;

    // Store the new access token so future requests use it
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
    // Keep the legacy key in sync during transition if used elsewhere
    localStorage.setItem(AUTH_STORAGE_KEYS.legacyAccessToken, accessToken);

    return accessToken;
  } catch {
    // If refresh fails for any reason, we signal that by returning null
    return null;
  }
};

/**
 * REQUEST INTERCEPTOR
 *
 * This runs BEFORE every request is sent.
 * Its job is to:
 * - read the access token from localStorage
 * - attach it to the `Authorization` header if it exists
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredAccessToken();

    if (token) {
      // We cast to `any` here because Axios' header type is a bit loose.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * RESPONSE INTERCEPTOR
 *
 * This runs AFTER every response comes back.
 * Normal successful responses just pass through.
 *
 * If we see a 401 Unauthorized from a non-auth endpoint, we:
 * 1. Try to refresh the access token using the refresh token.
 * 2. If refresh succeeds, retry the original request with the new token.
 * 3. If refresh fails, clear auth state and send the user to the login page.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    /**
     * Extend Axios' internal request config with our custom `_retry` flag
     * that we use to avoid retrying the same request multiple times.
     */
    interface RetryableRequestConfig extends InternalAxiosRequestConfig {
      _retry?: boolean;
    }

    // The original request configuration that failed
    const originalRequest = error.config as RetryableRequestConfig;

    const status = error.response?.status;
    const url = originalRequest?.url as string | undefined;

    // We do NOT want to run the refresh logic for the auth endpoints themselves
    // to avoid infinite loops.
    const isAuthEndpoint =
      url?.includes("/auth/login") ||
      url?.includes("/auth/register") ||
      url?.includes("/auth/refresh");

    // If it's not a 401, or we've already retried once, or it's an auth endpoint,
    // we just forward the error.
    if (status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If another request is already in the middle of refreshing the token,
    // we don't start a second refresh. Instead we:
    // - push this request into `failedQueue`
    // - wait until the refresh finishes
    // - then retry this request with the new token
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (originalRequest.headers as any).Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Mark this request so we don't try to refresh twice for it
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt to get a new access token using the refresh token
      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        throw new Error("Unable to refresh access token");
      }

      // Tell all queued requests that we have a new token
      processQueue(null, newAccessToken);

      // Retry the original request with the new token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (originalRequest.headers as any).Authorization =
        `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed: notify all waiting requests and clear auth state.
      processQueue(refreshError, null);

      // Clear everything we know about the current session
      clearPersistedAuth();

      // On the client, redirect the user to the login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
