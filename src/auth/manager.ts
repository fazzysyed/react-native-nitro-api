import type { AuthConfig, RefreshResult, TokenStorage } from '../core/types';
import { InMemoryTokenStorage } from './storage';

export interface AuthManager {
  getAccessToken(): Promise<string | null>;
  refresh(): Promise<string | null>;
  clear(): Promise<void>;
}

export function createAuthManager(config?: AuthConfig): AuthManager | null {
  if (!config) {
    return null;
  }

  const storage: TokenStorage = config.storage ?? new InMemoryTokenStorage();
  let refreshPromise: Promise<string | null> | null = null;

  return {
    async getAccessToken() {
      if (config.getAccessToken) {
        const token = await config.getAccessToken();
        if (token) {
          return token;
        }
      }
      return storage.getAccessToken();
    },
    async refresh() {
      if (!config.refreshToken) {
        return null;
      }

      if (refreshPromise) {
        return refreshPromise;
      }

      refreshPromise = (async () => {
        const result: RefreshResult = await config.refreshToken!({
          accessToken: await storage.getAccessToken(),
          refreshToken: await storage.getRefreshToken(),
        });

        await storage.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });

        return result.accessToken;
      })().finally(() => {
        refreshPromise = null;
      });

      return refreshPromise;
    },
    async clear() {
      await storage.clearTokens();
    },
  };
}
