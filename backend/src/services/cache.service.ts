import redis, { isRedisAvailable } from "../config/redis";

// In-memory fallback cache (when Redis is not available)
const memoryCache = new Map<string, { value: string; expiry?: number }>();

// Cache key prefixes
const KEYS = {
  USER_PERMISSIONS: (userId: string) => `user:${userId}:permissions`,
  REFRESH_TOKEN: (userId: string) => `user:${userId}:refreshToken`,
  PERMISSION_VERSION: (userId: string) => `user:${userId}:permVersion`,
} as const;

// Default TTLs (in seconds)
const TTL = {
  PERMISSIONS: 15 * 60,      // 15 minutes (matches access token)
  REFRESH_TOKEN: 7 * 24 * 60 * 60,  // 7 days
} as const;

/**
 * Check if Redis is available
 */
function isRedisUp(): boolean {
  return isRedisAvailable;
}

/**
 * Set with expiry in memory cache
 */
function setMemory(key: string, value: string, ttlSeconds?: number): void {
  const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
  memoryCache.set(key, { value, expiry });
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    for (const [k, v] of memoryCache.entries()) {
      if (v.expiry && Date.now() > v.expiry) {
        memoryCache.delete(k);
      }
    }
  }
}

/**
 * Get from memory cache with expiry check
 */
function getMemory(key: string): string | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  if (entry.expiry && Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.value;
}

/**
 * Delete from memory cache
 */
function deleteMemory(key: string): void {
  memoryCache.delete(key);
}

export class CacheService {
  /**
   * Cache user permissions
   */
  async cachePermissions(userId: string, permissions: string[]): Promise<void> {
    const key = KEYS.USER_PERMISSIONS(userId);
    const value = JSON.stringify(permissions);
    
    if (isRedisUp()) {
      try {
        await redis.set(key, value, "EX", TTL.PERMISSIONS);
        return;
      } catch (error) {
        console.error("Redis cachePermissions failed, using memory cache:", error);
      }
    }
    
    // Fallback to memory cache
    setMemory(key, value, TTL.PERMISSIONS);
  }

  /**
   * Get cached permissions
   */
  async getPermissions(userId: string): Promise<string[] | null> {
    const key = KEYS.USER_PERMISSIONS(userId);
    
    if (isRedisUp()) {
      try {
        const cached = await redis.get(key);
        if (cached) return JSON.parse(cached);
      } catch (error) {
        console.error("Redis getPermissions failed, using memory cache:", error);
      }
    }
    
    // Fallback to memory cache
    const cached = getMemory(key);
    if (cached) return JSON.parse(cached);
    
    return null;
  }

  /**
   * Invalidate user permissions cache
   */
  async invalidatePermissions(userId: string): Promise<void> {
    const key = KEYS.USER_PERMISSIONS(userId);
    
    if (isRedisUp()) {
      try {
        await redis.del(key);
      } catch (error) {
        console.error("Redis invalidatePermissions failed:", error);
      }
    }
    
    // Also clear from memory cache
    deleteMemory(key);
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const key = KEYS.REFRESH_TOKEN(userId);
    
    if (isRedisUp()) {
      try {
        await redis.set(key, token, "EX", TTL.REFRESH_TOKEN);
        return;
      } catch (error) {
        console.error("Redis storeRefreshToken failed, using memory cache:", error);
      }
    }
    
    // Fallback to memory cache
    setMemory(key, token, TTL.REFRESH_TOKEN);
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const key = KEYS.REFRESH_TOKEN(userId);
    
    if (isRedisUp()) {
      try {
        const stored = await redis.get(key);
        return stored === token;
      } catch (error) {
        console.error("Redis validateRefreshToken failed, using memory cache:", error);
      }
    }
    
    // Fallback to memory cache
    const stored = getMemory(key);
    return stored === token;
  }

  /**
   * Invalidate refresh token (on logout or token rotation)
   */
  async invalidateRefreshToken(userId: string): Promise<void> {
    const key = KEYS.REFRESH_TOKEN(userId);
    
    if (isRedisUp()) {
      try {
        await redis.del(key);
      } catch (error) {
        console.error("Redis invalidateRefreshToken failed:", error);
      }
    }
    
    // Also clear from memory cache
    deleteMemory(key);
  }

  /**
   * Get permission version (for cache invalidation tracking)
   */
  async getPermissionVersion(userId: string): Promise<number | null> {
    const key = KEYS.PERMISSION_VERSION(userId);
    
    if (isRedisUp()) {
      try {
        const version = await redis.get(key);
        return version ? parseInt(version) : null;
      } catch (error) {
        console.error("Redis getPermissionVersion failed, using memory cache:", error);
      }
    }
    
    // Fallback to memory cache
    const version = getMemory(key);
    return version ? parseInt(version) : null;
  }

  /**
   * Increment permission version (call when permissions change)
   */
  async incrementPermissionVersion(userId: string): Promise<number> {
    const key = KEYS.PERMISSION_VERSION(userId);
    
    if (isRedisUp()) {
      try {
        const newVersion = await redis.incr(key);
        await redis.expire(key, TTL.REFRESH_TOKEN);
        return newVersion;
      } catch (error) {
        console.error("Redis incrementPermissionVersion failed, using memory cache:", error);
      }
    }
    
    // Fallback to memory cache
    const current = await this.getPermissionVersion(userId);
    const newVersion = (current || 0) + 1;
    setMemory(key, newVersion.toString(), TTL.REFRESH_TOKEN);
    return newVersion;
  }

  /**
   * Clear all user-related cache
   */
  async clearUserCache(userId: string): Promise<void> {
    const keys = [
      KEYS.USER_PERMISSIONS(userId),
      KEYS.REFRESH_TOKEN(userId),
      KEYS.PERMISSION_VERSION(userId),
    ];
    
    if (isRedisUp()) {
      try {
        await redis.del(...keys);
      } catch (error) {
        console.error("Redis clearUserCache failed:", error);
      }
    }
    
    // Also clear from memory cache
    keys.forEach(deleteMemory);
  }
}

export const cacheService = new CacheService();
export default cacheService;
