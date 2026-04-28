import type { CacheAdapter, CacheValue } from '../core/types';

export function createMapCacheAdapter(): CacheAdapter {
  const storage = new Map<string, CacheValue>();

  return {
    set(key, value, ttl = 0) {
      const now = Date.now();
      storage.set(key, {
        value,
        expiresAt: ttl > 0 ? now + ttl : 0,
      });
    },
    get<T>(key: string): T | null {
      const hit = storage.get(key) as CacheValue<T> | undefined;
      if (!hit) {
        return null;
      }
      if (hit.expiresAt !== 0 && hit.expiresAt <= Date.now()) {
        storage.delete(key);
        return null;
      }
      return hit.value;
    },
    getWithMeta<T>(key: string): CacheValue<T> | null {
      const hit = storage.get(key) as CacheValue<T> | undefined;
      if (!hit) {
        return null;
      }
      if (hit.expiresAt !== 0 && hit.expiresAt <= Date.now()) {
        storage.delete(key);
        return null;
      }
      return hit;
    },
    remove(key) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    },
  };
}
