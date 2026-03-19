import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipLoginRedirect?: boolean;
  }
}

/**
 * This file creates a single, shared Axios instance (`apiClient`)
 * that the whole frontend uses to talk to the backend API.
 *
 * It adds three important behaviors on top of plain Axios:
 * 1. Automatically includes auth cookies on every request.
 * 2. When the backend says "401 Unauthorized" because the access token expired,
 *    it tries to refresh using the HttpOnly refresh-token cookie.
 * 3. If multiple requests fail at the same time while we are refreshing,
 *    it queues them and retries all of them after the refresh succeeds.
 */

// 1) Create a configured Axios instance
const apiClient = axios.create({
  // Base URL for all API requests. You can override this with NEXT_PUBLIC_API_URL
  // in your `.env` file. If it's not set, we fall back to the local dev API.
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
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
  resolve: () => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * After we finish refreshing (either successfully or with an error),
 * we go through `failedQueue`:
 * - if we got an error, we reject all waiting promises
 * - if we got a new token, we resolve them with that token
 */
const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Call the backend to exchange the refresh token for a new access token.
 *
 * The browser automatically includes the HttpOnly refresh-token cookie because
 * this Axios client is configured with `withCredentials: true`.
 *
 * Returns:
 * - `true` if everything worked
 * - `false` if something went wrong
 */
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    await apiClient.post("/auth/refresh");
    return true;
  } catch {
    return false;
  }
};

/**
 * RESPONSE INTERCEPTOR
 *
 * This runs AFTER every response comes back.
 * Normal successful responses just pass through.
 *
 * If we see a 401 Unauthorized from a non-auth endpoint, we:
 * 1. Try to refresh the access cookie using the refresh cookie.
 * 2. If refresh succeeds, retry the original request.
 * 3. If refresh fails, send the user to the login page.
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
      skipLoginRedirect?: boolean;
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
        .then(() => apiClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    // Mark this request so we don't try to refresh twice for it
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt to get a new access token using the refresh token
      const didRefresh = await refreshAccessToken();

      if (!didRefresh) {
        throw new Error("Unable to refresh access token");
      }

      // Tell all queued requests that the browser now has a fresh access cookie.
      processQueue(null);

      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed: notify all waiting requests and clear auth state.
      processQueue(refreshError);

      // On the client, redirect the user to the login page
      if (
        typeof window !== "undefined" &&
        !originalRequest.skipLoginRedirect &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
