import type { CacheAdapter, CacheValue } from '../core/types';

interface NitroCacheBridge {
  set(key: string, value: CacheValue, ttl?: number): void;
  get(key: string): CacheValue | null;
  remove(key: string): void;
  clear(): void;
}

interface NitroModulesProxy {
  createHybridObject<T extends object>(name: string): T;
  hasHybridObject(name: string): boolean;
}

declare global {
  var NitroModules: {
    NitroCache?: NitroCacheBridge;
  } | undefined;
  var NitroModulesProxy: NitroModulesProxy | undefined;
}

function getNitroModulesProxy(): NitroModulesProxy | null {
  try {
    const nitroModulesPkg = require('react-native-nitro-modules') as {
      NitroModules?: NitroModulesProxy;
    };
    if (nitroModulesPkg?.NitroModules) {
      return nitroModulesPkg.NitroModules;
    }
  } catch {
    // Optional dependency is not installed in this app.
  }
  return globalThis.NitroModulesProxy ?? null;
}

function getNitroCacheFromProxy(proxy: NitroModulesProxy | null): NitroCacheBridge | null {
  if (!proxy) {
    return null;
  }
  try {
    if (!proxy.hasHybridObject('NitroCache')) {
      return null;
    }
    return proxy.createHybridObject<NitroCacheBridge>('NitroCache');
  } catch {
    return null;
  }
}

function getLegacyNitroCache(): NitroCacheBridge | null {
  return globalThis.NitroModules?.NitroCache ?? null;
}

export function createNitroCacheAdapter(): CacheAdapter | null {
  const nitro = getNitroCacheFromProxy(getNitroModulesProxy()) ?? getLegacyNitroCache();
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
