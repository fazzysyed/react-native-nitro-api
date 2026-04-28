import type { AxiosRequestConfig } from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface APIError {
  message: string;
  status: number;
  data?: unknown;
  originalError?: unknown;
}

export interface CreateAPIOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  cache?: CacheConfig;
  auth?: AuthConfig;
  debug?: boolean;
  dedupe?: boolean;
  offlineQueue?: boolean;
}

export interface RequestConfig<TBody = unknown> {
  params?: Record<string, unknown>;
  routeParams?: Record<string, string | number>;
  data?: TBody;
  headers?: Record<string, string>;
  timeout?: number;
  cache?: CachePolicy;
  signal?: AbortSignal;
  axiosConfig?: Omit<AxiosRequestConfig, 'method' | 'url' | 'baseURL' | 'params' | 'data' | 'headers'>;
}

export interface MediaFile {
  uri: string;
  name?: string;
  type?: string;
}

export type UploadFieldValue = string | number | boolean | null | undefined;

export interface UploadConfig {
  files: MediaFile | MediaFile[];
  fields?: Record<string, UploadFieldValue>;
  fileFieldName?: string;
}

export interface ChunkUploadProgress {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  uploadedBytes: number;
  totalBytes: number;
  progress: number;
}

export interface ResumableUploadConfig {
  file: MediaFile;
  chunkSize?: number;
  uploadId?: string;
  maxRetriesPerChunk?: number;
  startChunkIndex?: number;
  metadata?: Record<string, unknown>;
  onProgress?: (progress: ChunkUploadProgress) => void;
  finalizeEndpoint?: string;
}

export interface ResumableUploadResult<TFinalize = unknown, TChunk = unknown> {
  uploadId: string;
  totalChunks: number;
  totalBytes: number;
  lastChunkResponse?: TChunk;
  finalizeResponse?: TFinalize;
}

export interface CacheConfig {
  enabled?: boolean;
  defaultTTL?: number;
  staleWhileRevalidate?: boolean;
}

export interface CachePolicy {
  enabled?: boolean;
  ttl?: number;
  staleWhileRevalidate?: boolean;
  key?: string;
}

export interface AuthConfig {
  storage?: TokenStorage;
  getAccessToken?: () => Promise<string | null> | string | null;
  refreshToken?: (context: RefreshContext) => Promise<RefreshResult>;
  shouldRefresh?: (status: number) => boolean;
  refreshEndpoint?: string;
}

export interface RefreshContext {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken?: string | null;
}

export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: { accessToken: string; refreshToken?: string | null }): Promise<void>;
  clearTokens(): Promise<void>;
}

export interface CacheValue<T = unknown> {
  value: T;
  expiresAt: number;
  staleAt?: number;
}

export interface CacheAdapter {
  set<T>(key: string, value: T, ttl?: number): void;
  get<T>(key: string): T | null;
  getWithMeta?<T>(key: string): CacheValue<T> | null;
  remove(key: string): void;
  clear(): void;
}

export interface RequestDescriptor {
  method: HttpMethod;
  url: string;
  params?: Record<string, unknown>;
}

export interface APIClient {
  get<TResponse = unknown>(url: string, config?: RequestConfig): Promise<TResponse>;
  post<TResponse = unknown, TBody = unknown>(url: string, body?: TBody, config?: RequestConfig<TBody>): Promise<TResponse>;
  put<TResponse = unknown, TBody = unknown>(url: string, body?: TBody, config?: RequestConfig<TBody>): Promise<TResponse>;
  patch<TResponse = unknown, TBody = unknown>(url: string, body?: TBody, config?: RequestConfig<TBody>): Promise<TResponse>;
  delete<TResponse = unknown>(url: string, config?: RequestConfig): Promise<TResponse>;
  upload<TResponse = unknown>(url: string, config: UploadConfig, requestConfig?: RequestConfig<FormData>): Promise<TResponse>;
  uploadLink<TResponse = unknown>(
    url: string,
    link: string,
    payload?: Record<string, unknown>,
    requestConfig?: RequestConfig<Record<string, unknown>>,
  ): Promise<TResponse>;
  uploadResumable<TFinalize = unknown, TChunk = unknown>(
    url: string,
    config: ResumableUploadConfig,
    requestConfig?: RequestConfig<Blob>,
  ): Promise<ResumableUploadResult<TFinalize, TChunk>>;
  invalidate(descriptor?: Partial<RequestDescriptor>): void;
  clearCache(): void;
  clearOfflineQueue(): void;
}
