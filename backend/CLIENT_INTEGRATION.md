# Client Integration Guide: Authentication & Permission Sync

This guide explains how to integrate the new token-based authentication system with Redis caching on the client side.

---

## 📋 Table of Contents

1. [Authentication Flow Overview](#authentication-flow-overview)
2. [API Endpoints](#api-endpoints)
3. [Client-Side Implementation](#client-side-implementation)
4. [Token Refresh Strategy](#token-refresh-strategy)
5. [Permission Synchronization](#permission-synchronization)

---

## 🔐 Authentication Flow Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Client    │     │   Backend    │     │    Redis     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  POST /auth/login  │                    │
       │───────────────────>│                    │
       │                    │  Cache permissions │
       │                    │───────────────────>│
       │                    │  Store refresh token│
       │                    │───────────────────>│
       │  { accessToken,    │                    │
       │    refreshToken,   │                    │
       │    permissions }   │                    │
       │<───────────────────│                    │
       │                    │                    │
       │  Request (with AT) │                    │
       │───────────────────>│  Get permissions   │
       │                    │───────────────────>│
       │                    │  Return permissions│
       │                    │<───────────────────│
       │  Response          │                    │
       │<───────────────────│                    │
       │                    │                    │
       │  Access Token      │                    │
       │  Expired!          │                    │
       │  POST /auth/refresh│                    │
       │  (with RT)         │                    │
       │───────────────────>│  Validate RT       │
       │                    │───────────────────>│
       │  { accessToken }   │  RT valid?         │
       │<───────────────────│                    │
       │                    │                    │
```

---

## 📡 API Endpoints

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "permissions": ["read:Post", "create:Post", "delete:Post"]
  }
}
```

### 2. Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>

Response:
{
  "message": "Logout successful"
}
```

### 4. Get My Permissions (Sync)
```http
GET /api/auth/permissions
Authorization: Bearer <accessToken>

Response:
{
  "permissions": ["read:Post", "create:Post", "delete:Post"],
  "fetchedAt": "2024-01-15T10:30:00.000Z"
}
```

### 5. Get My Profile
```http
GET /api/auth/me
Authorization: Bearer <accessToken>

Response:
{
  "user": {
    "id": "uuid",
    "permissions": ["read:Post", "create:Post", "delete:Post"]
  }
}
```

---

## 💻 Client-Side Implementation

### TypeScript/JavaScript Example

```typescript
// types/auth.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  permissions: string[];
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// services/auth.service.ts
class AuthService {
  private tokens: AuthTokens | null = null;
  private user: User | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Login and store tokens
   */
  async login(email: string, password: string): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data: LoginResponse = await response.json();
    
    // Store tokens and user
    this.tokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
    this.user = data.user;

    // Schedule token refresh (refresh at 80% of expiry time)
    this.scheduleTokenRefresh(data.expiresIn * 1000 * 0.8);

    return data.user;
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    if (this.tokens?.accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens.accessToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearAuth();
  }

  /**
   * Get access token (auto-refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) return null;

    // Check if token needs refresh (within 1 minute of expiry)
    const decoded = this.decodeToken(this.tokens.accessToken);
    const now = Date.now() / 1000;
    const timeUntilExpiry = (decoded.exp || 0) - now;

    if (timeUntilExpiry < 60) {
      await this.refreshAccessToken();
    }

    return this.tokens?.accessToken || null;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
    });

    if (!response.ok) {
      // Refresh failed - force re-login
      this.clearAuth();
      window.location.href = '/login';
      throw new Error('Session expired, please login again');
    }

    const data = await response.json();
    
    // Update only access token
    this.tokens.accessToken = data.accessToken;
    this.tokens.expiresIn = data.expiresIn;

    // Schedule next refresh
    this.scheduleTokenRefresh(data.expiresIn * 1000 * 0.8);
  }

  /**
   * Sync permissions from backend
   */
  async syncPermissions(): Promise<string[]> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/permissions', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to sync permissions');
    }

    const data = await response.json();
    
    // Update local user permissions
    if (this.user) {
      this.user.permissions = data.permissions;
    }

    return data.permissions;
  }

  /**
   * Check if user has permission
   */
  hasPermission(action: string, subject: string): boolean {
    if (!this.user) return false;
    
    const permission = `${action}:${subject}`;
    const managePermission = `manage:${subject}`;
    const manageAll = 'manage:all';
    
    return this.user.permissions.includes(permission) ||
           this.user.permissions.includes(managePermission) ||
           this.user.permissions.includes(manageAll);
  }

  /**
   * Check if user has any of the permissions
   */
  hasAnyPermission(permissions: Array<[string, string]>): boolean {
    return permissions.some(([action, subject]) => 
      this.hasPermission(action, subject)
    );
  }

  /**
   * Check if user has all of the permissions
   */
  hasAllPermissions(permissions: Array<[string, string]>): boolean {
    return permissions.every(([action, subject]) => 
      this.hasPermission(action, subject)
    );
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    if (!this.tokens?.accessToken) return false;
    
    try {
      const decoded = this.decodeToken(this.tokens.accessToken);
      return (decoded.exp || 0) > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  // Private helpers

  private clearAuth(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.tokens = null;
    this.user = null;
  }

  private scheduleTokenRefresh(delayMs: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch(console.error);
    }, delayMs);
  }

  private decodeToken(token: string): { exp?: number; [key: string]: any } {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  }
}

// Export singleton instance
export const authService = new AuthService();
```

---

## 🔄 Token Refresh Strategy

### Automatic Refresh (Recommended)

```typescript
// Axios interceptor example
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(async config => {
  const token = await authService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await authService.refreshAccessToken();
        const token = await authService.getAccessToken();
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        authService.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 🔄 Permission Synchronization

### When to Sync Permissions

| Trigger | Strategy |
|---------|----------|
| Initial login | Get from login response |
| Token refresh | Optional - check version |
| 403 Forbidden | Force sync, then retry |
| Periodic (5-10 min) | Background sync |
| User action (button click) | On-demand sync |

### Permission Check Component (React Example)

```tsx
// components/Can.tsx
import { authService } from '../services/auth.service';

interface CanProps {
  do: string;  // action
  on: string;  // subject
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ 
  do, 
  on, 
  children, 
  fallback = null 
}) => {
  if (authService.hasPermission(do, on)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

// Usage:
// <Can do="delete" on="Post">
//   <button>Delete Post</button>
// </Can>
```

### Permission Hook (React)

```tsx
// hooks/usePermission.ts
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export function usePermission(action: string, subject: string) {
  const [hasAccess, setHasAccess] = useState(
    authService.hasPermission(action, subject)
  );

  useEffect(() => {
    // Update when permissions change
    const checkPermission = () => {
      setHasAccess(authService.hasPermission(action, subject));
    };

    checkPermission();
    
    // Optional: Periodic re-check
    const interval = setInterval(checkPermission, 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, [action, subject]);

  return hasAccess;
}

// Usage:
// const canDelete = usePermission('delete', 'Post');
// if (canDelete) { /* show delete button */ }
```

---

## 📊 Summary

### What Changed

| Before | After |
|--------|-------|
| Permissions in JWT | Permissions in Redis cache |
| Single token (1 day) | Access token (15 min) + Refresh token (7 days) |
| No invalidation | Real-time cache invalidation |
| Token bloat | Minimal token size |

### Benefits

1. **Smaller tokens** - Access tokens only contain userId
2. **Real-time revocation** - Permissions can be invalidated immediately
3. **Better scalability** - Redis handles permission lookups efficiently
4. **Improved security** - Short-lived access tokens

### Migration Notes

- Old tokens (legacy format with embedded permissions) are still supported during transition
- New logins automatically use the new token format
- Client should be updated to handle token refresh flow
