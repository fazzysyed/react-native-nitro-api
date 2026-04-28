import type { CacheAdapter, CacheValue } from '../core/types';

interface NitroCacheBridge {
  set(key: string, value: CacheValue, ttl?: number): void;
  get(key: string): CacheValue | null;
  remove(key: string): void;
  clear(): void;
}

declare global {
  var NitroModules: {
    NitroCache?: NitroCacheBridge;
  } | undefined;
}

function getNitroCache(): NitroCacheBridge | null {
  return globalThis.NitroModules?.NitroCache ?? null;
}

export function createNitroCacheAdapter(): CacheAdapter | null {
  const nitro = getNitroCache();
  if (!nitro) {
    return null;
  }

  return {
    set(key, value, ttl) {
      const payload: CacheValue = {
        value,
        expiresAt: Date.now() + (ttl ?? 0),
      };
      nitro.set(key, payload, ttl);
    },
    get<T>(key: string): T | null {
      const hit = nitro.get(key) as CacheValue<T> | null;
      if (!hit) {
        return null;
      }
      if (hit.expiresAt !== 0 && hit.expiresAt <= Date.now()) {
        nitro.remove(key);
        return null;
      }
      return hit.value;
    },
    getWithMeta<T>(key: string): CacheValue<T> | null {
      const hit = nitro.get(key) as CacheValue<T> | null;
      if (!hit) {
        return null;
      }
      if (hit.expiresAt !== 0 && hit.expiresAt <= Date.now()) {
        nitro.remove(key);
        return null;
      }
      return hit;
    },
    remove(key) {
      nitro.remove(key);
    },
    clear() {
      nitro.clear();
    },
  };
}
