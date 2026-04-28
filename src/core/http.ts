import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createAuthManager } from '../auth/manager';
import { createCacheManager } from '../cache/cache';
import { normalizeError } from './errors';
import type { APIError, CreateAPIOptions, HttpMethod, RequestConfig } from './types';
import { createRequestKey } from '../utils/hash';
import { createLogger } from '../utils/logger';
import { resolveRoute } from '../utils/route';

interface ExecuteOptions<TBody> {
  method: HttpMethod;
  url: string;
  body?: TBody;
  config?: RequestConfig<TBody>;
}

interface OfflineQueueItem {
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

export interface HTTPClient {
  execute<TResponse = unknown, TBody = unknown>(options: ExecuteOptions<TBody>): Promise<TResponse>;
  invalidate(prefix?: string): void;
  clearCache(): void;
  clearOfflineQueue(): void;
}

export function createHTTPClient(options: CreateAPIOptions): HTTPClient {
  const instance: AxiosInstance = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout ?? 15000,
    headers: options.headers,
  });

  const logger = createLogger(Boolean(options.debug));
  const cacheManager = createCacheManager();
  const auth = createAuthManager(options.auth);
  const inFlight = new Map<string, Promise<unknown>>();
  const queue: OfflineQueueItem[] = [];

  const cacheEnabled = options.cache?.enabled ?? true;
  const defaultTTL = options.cache?.defaultTTL ?? 15_000;
  const defaultSWR = options.cache?.staleWhileRevalidate ?? false;

  const shouldDedupe = options.dedupe ?? true;
  const shouldQueueOffline = options.offlineQueue ?? true;

  async function executeNetwork<TResponse, TBody>(
    method: HttpMethod,
    resolvedUrl: string,
    config: RequestConfig<TBody> | undefined,
    body: TBody | undefined,
    retryOn401 = true,
  ): Promise<TResponse> {
    const startedAt = Date.now();

    const headers: Record<string, string> = {
      ...(config?.headers ?? {}),
    };

    if (auth) {
      const token = await auth.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: resolvedUrl,
      params: config?.params,
      data: body,
      headers,
      timeout: config?.timeout,
      signal: config?.signal,
      ...(config?.axiosConfig ?? {}),
    };

    try {
      const response: AxiosResponse<TResponse> = await instance.request<TResponse>(axiosConfig);
      logger.debug(`HTTP ${method} ${resolvedUrl} (${Date.now() - startedAt}ms)`, {
        status: response.status,
      });
      return response.data;
    } catch (error) {
      const normalized = normalizeError(error);
      const shouldRefresh =
        retryOn401 &&
        normalized.status === 401 &&
        Boolean(auth) &&
        (options.auth?.shouldRefresh?.(normalized.status) ?? true);

      if (shouldRefresh && auth) {
        try {
          const refreshedToken = await auth.refresh();
          if (refreshedToken) {
            return executeNetwork(method, resolvedUrl, config, body, false);
          }
        } catch (refreshError) {
          logger.error('Token refresh failed', refreshError);
          await auth.clear();
        }
      }

      throw normalized;
    }
  }

  function processOfflineQueue(): void {
    if (!queue.length) {
      return;
    }

    while (queue.length) {
      const item = queue.shift();
      if (!item) {
        return;
      }
      item.run().then(item.resolve).catch(item.reject);
    }
  }

  async function execute<TResponse = unknown, TBody = unknown>(params: ExecuteOptions<TBody>): Promise<TResponse> {
    const resolvedUrl = resolveRoute(params.url, params.config?.routeParams);
    const requestKey = params.config?.cache?.key ?? createRequestKey(params.method, resolvedUrl, params.config?.params);

    const cachePolicy = {
      enabled: params.config?.cache?.enabled ?? cacheEnabled,
      ttl: params.config?.cache?.ttl ?? defaultTTL,
      staleWhileRevalidate: params.config?.cache?.staleWhileRevalidate ?? defaultSWR,
    };

    if (cachePolicy.enabled && params.method === 'GET') {
      const cached = cacheManager.getWithMeta?.<TResponse>(requestKey) ?? null;
      if (cached?.value !== undefined) {
        const now = Date.now();
        const isFresh = cached.expiresAt === 0 || cached.expiresAt > now;

        if (isFresh) {
          return cached.value;
        }

        if (cachePolicy.staleWhileRevalidate) {
          void executeNetwork<TResponse, TBody>(params.method, resolvedUrl, params.config, params.body).then((freshData) => {
            cacheManager.set(requestKey, freshData, cachePolicy.ttl);
          });
          return cached.value;
        }
      }
    }

    const shouldDedupeRequest = shouldDedupe && params.method === 'GET';

    if (shouldDedupeRequest && inFlight.has(requestKey)) {
      return inFlight.get(requestKey) as Promise<TResponse>;
    }

    const networkCall = executeNetwork<TResponse, TBody>(
      params.method,
      resolvedUrl,
      params.config,
      params.body,
    )
      .then((response) => {
        if (cachePolicy.enabled && params.method === 'GET') {
          cacheManager.set(requestKey, response, cachePolicy.ttl);
        }
        return response;
      })
      .catch((error: APIError) => {
        const isNetworkFailure = error.status === 0;
        if (shouldQueueOffline && isNetworkFailure) {
          return new Promise<TResponse>((resolve, reject) => {
            queue.push({
              run: () => execute<TResponse, TBody>(params),
              resolve: (value) => resolve(value as TResponse),
              reject,
            });
          });
        }
        throw error;
      })
      .finally(() => {
        inFlight.delete(requestKey);
      });

    if (shouldDedupeRequest) {
      inFlight.set(requestKey, networkCall);
    }

    return networkCall;
  }

  const maybeEventTarget = globalThis as unknown as {
    addEventListener?: (event: string, cb: () => void) => void;
  };
  if (typeof maybeEventTarget.addEventListener === 'function') {
    maybeEventTarget.addEventListener('online', processOfflineQueue);
  }

  return {
    execute,
    invalidate(prefix) {
      cacheManager.invalidateByPrefix(prefix ?? '');
    },
    clearCache() {
      cacheManager.clear();
    },
    clearOfflineQueue() {
      queue.splice(0, queue.length);
    },
  };
}
