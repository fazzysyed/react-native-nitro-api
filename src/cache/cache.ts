import type { CacheAdapter, CacheValue } from '../core/types';
import { createMapCacheAdapter } from './fallback';
import { createNitroCacheAdapter } from './nitro';

export interface CacheManager {
  isNative: boolean;
  get<T>(key: string): T | null;
  getWithMeta<T>(key: string): CacheValue<T> | null;
  set<T>(key: string, value: T, ttl?: number): void;
  remove(key: string): void;
  clear(): void;
  invalidateByPrefix(prefix: string): void;
}

export function createCacheManager(): CacheManager {
  const nitroAdapter = createNitroCacheAdapter();
  const adapter: CacheAdapter = nitroAdapter ?? createMapCacheAdapter();
  const isNative = Boolean(nitroAdapter);

  // Prefix invalidation is only possible in JS without native index support.
  const jsIndex = new Set<string>();

  return {
    isNative,
    get<T>(key: string) {
      return adapter.get<T>(key);
    },
    getWithMeta<T>(key: string) {
      return adapter.getWithMeta ? adapter.getWithMeta<T>(key) : null;
    },
    set<T>(key: string, value: T, ttl?: number) {
      jsIndex.add(key);
      adapter.set(key, value, ttl);
    },
    remove(key: string) {
      jsIndex.delete(key);
      adapter.remove(key);
    },
    clear() {
      jsIndex.clear();
      adapter.clear();
    },
    invalidateByPrefix(prefix: string) {
      for (const key of jsIndex) {
        if (key.startsWith(prefix)) {
          jsIndex.delete(key);
          adapter.remove(key);
        }
      }
    },
  };
}
