import { createHTTPClient } from './http';
import type {
  APIClient,
  CreateAPIOptions,
  RequestConfig,
  ResumableUploadConfig,
  ResumableUploadResult,
  UploadConfig,
} from './types';
import { createRequestKey } from '../utils/hash';
import { resolveRoute } from '../utils/route';
import { createUploadFormData } from '../utils/media';

function generateUploadId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function loadBlobFromUri(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read file for upload: ${response.status}`);
  }
  return response.blob();
}

export function createAPI(options: CreateAPIOptions): APIClient {
  const http = createHTTPClient(options);

  return {
    get<TResponse = unknown>(url: string, config?: RequestConfig): Promise<TResponse> {
      return http.execute<TResponse>({ method: 'GET', url, config });
    },
    post<TResponse = unknown, TBody = unknown>(
      url: string,
      body?: TBody,
      config?: RequestConfig<TBody>,
    ): Promise<TResponse> {
      return http.execute<TResponse, TBody>({ method: 'POST', url, body, config });
    },
    put<TResponse = unknown, TBody = unknown>(
      url: string,
      body?: TBody,
      config?: RequestConfig<TBody>,
    ): Promise<TResponse> {
      return http.execute<TResponse, TBody>({ method: 'PUT', url, body, config });
    },
    patch<TResponse = unknown, TBody = unknown>(
      url: string,
      body?: TBody,
      config?: RequestConfig<TBody>,
    ): Promise<TResponse> {
      return http.execute<TResponse, TBody>({ method: 'PATCH', url, body, config });
    },
    delete<TResponse = unknown>(url: string, config?: RequestConfig): Promise<TResponse> {
      return http.execute<TResponse>({ method: 'DELETE', url, config });
    },
    upload<TResponse = unknown>(url: string, uploadConfig: UploadConfig, requestConfig?: RequestConfig<FormData>): Promise<TResponse> {
      const formData = createUploadFormData(uploadConfig);
      const mergedConfig: RequestConfig<FormData> = {
        ...(requestConfig ?? {}),
        headers: {
          ...(requestConfig?.headers ?? {}),
          'Content-Type': 'multipart/form-data',
        },
      };
      return http.execute<TResponse, FormData>({
        method: 'POST',
        url,
        body: formData,
        config: mergedConfig,
      });
    },
    uploadLink<TResponse = unknown>(
      url: string,
      link: string,
      payload?: Record<string, unknown>,
      requestConfig?: RequestConfig<Record<string, unknown>>,
    ): Promise<TResponse> {
      return http.execute<TResponse, Record<string, unknown>>({
        method: 'POST',
        url,
        body: {
          ...(payload ?? {}),
          link,
        },
        config: requestConfig,
      });
    },
    async uploadResumable<TFinalize = unknown, TChunk = unknown>(
      url: string,
      config: ResumableUploadConfig,
      requestConfig?: RequestConfig<Blob>,
    ): Promise<ResumableUploadResult<TFinalize, TChunk>> {
      const chunkSize = config.chunkSize && config.chunkSize > 0 ? config.chunkSize : 5 * 1024 * 1024;
      const maxRetries = Math.max(0, config.maxRetriesPerChunk ?? 2);
      const startChunkIndex = Math.max(0, config.startChunkIndex ?? 0);
      const uploadId = config.uploadId ?? generateUploadId();

      if (!config.file.uri) {
        throw new Error('Resumable upload requires file.uri');
      }

      const blob = await loadBlobFromUri(config.file.uri);
      const totalBytes = blob.size;
      const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));
      let uploadedBytes = Math.min(startChunkIndex * chunkSize, totalBytes);
      let lastChunkResponse: TChunk | undefined;

      for (let chunkIndex = startChunkIndex; chunkIndex < totalChunks; chunkIndex += 1) {
        if (requestConfig?.signal?.aborted) {
          throw new Error('Upload cancelled');
        }

        const startByte = chunkIndex * chunkSize;
        const endByteExclusive = Math.min(startByte + chunkSize, totalBytes);
        const chunk = blob.slice(startByte, endByteExclusive, config.file.type ?? 'application/octet-stream');

        let attempt = 0;
        while (attempt <= maxRetries) {
          try {
            const mergedHeaders = {
              ...(requestConfig?.headers ?? {}),
              'Content-Type': config.file.type ?? 'application/octet-stream',
              'x-upload-id': uploadId,
              'x-file-name': config.file.name ?? 'upload.bin',
              'x-file-size': String(totalBytes),
              'x-chunk-index': String(chunkIndex),
              'x-total-chunks': String(totalChunks),
              'Content-Range': `bytes ${startByte}-${endByteExclusive - 1}/${totalBytes}`,
            };

            lastChunkResponse = await http.execute<TChunk, Blob>({
              method: 'POST',
              url,
              body: chunk,
              config: {
                ...(requestConfig ?? {}),
                cache: { enabled: false },
                headers: mergedHeaders,
              },
            });
            break;
          } catch (error) {
            if (requestConfig?.signal?.aborted) {
              throw new Error('Upload cancelled');
            }
            if (attempt >= maxRetries) {
              throw error;
            }
            attempt += 1;
          }
        }

        uploadedBytes = endByteExclusive;
        config.onProgress?.({
          uploadId,
          chunkIndex,
          totalChunks,
          uploadedBytes,
          totalBytes,
          progress: totalBytes === 0 ? 1 : uploadedBytes / totalBytes,
        });
      }

      let finalizeResponse: TFinalize | undefined;
      if (config.finalizeEndpoint) {
        finalizeResponse = await http.execute<TFinalize, Record<string, unknown>>({
          method: 'POST',
          url: config.finalizeEndpoint,
          body: {
            uploadId,
            fileName: config.file.name ?? null,
            fileType: config.file.type ?? null,
            totalChunks,
            totalBytes,
            ...(config.metadata ?? {}),
          },
          config: {
            cache: { enabled: false },
          },
        });
      }

      return {
        uploadId,
        totalChunks,
        totalBytes,
        lastChunkResponse,
        finalizeResponse,
      };
    },
    invalidate(descriptor) {
      if (!descriptor?.method && !descriptor?.url) {
        http.invalidate();
        return;
      }

      const method = (descriptor.method ?? '').toUpperCase();
      const route = descriptor.url ? resolveRoute(descriptor.url) : '';
      const keyPrefix = `${method}::${route}`;
      http.invalidate(keyPrefix);
    },
    clearCache() {
      http.clearCache();
    },
    clearOfflineQueue() {
      http.clearOfflineQueue();
    },
  };
}

export function getCacheKey(method: string, url: string, params?: Record<string, unknown>): string {
  return createRequestKey(method, url, params);
}
