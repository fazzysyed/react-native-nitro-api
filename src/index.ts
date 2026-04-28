export { createAPI, getCacheKey } from './core/client';
export { normalizeError } from './core/errors';
export type {
  APIClient,
  APIError,
  AuthConfig,
  CacheConfig,
  CachePolicy,
  CreateAPIOptions,
  ChunkUploadProgress,
  MediaFile,
  RequestConfig,
  ResumableUploadConfig,
  ResumableUploadResult,
  TokenStorage,
  UploadConfig,
  UploadFieldValue,
} from './core/types';

export { createEndpoints } from './endpoints/createEndpoints';
export { createNamespace } from './endpoints/namespaces';
export { createResource } from './endpoints/resources';
export { createQueryHooks } from './hooks/reactQuery';

export { createCacheManager } from './cache/cache';
export { createNitroCacheAdapter } from './cache/nitro';
export { createMapCacheAdapter } from './cache/fallback';

export { InMemoryTokenStorage } from './auth/storage';
