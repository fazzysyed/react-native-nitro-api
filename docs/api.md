# API Reference

## Installation modes

- Base mode: install only `react-native-nitro-api` (JS cache fallback).
- Nitro mode: additionally install `react-native-nitro-modules` in the app and run iOS pods.

```sh
npm install react-native-nitro-api
npm install react-native-nitro-modules
cd ios && pod install
```

## `createAPI(options)`

Creates an API client instance.

### Options

```ts
createAPI({
  baseURL: string,
  timeout?: number,
  headers?: Record<string, string>,
  cache?: {
    enabled?: boolean,
    defaultTTL?: number,
    staleWhileRevalidate?: boolean,
  },
  auth?: {
    storage?: TokenStorage,
    getAccessToken?: () => Promise<string | null> | string | null,
    refreshToken?: (context) => Promise<{ accessToken: string; refreshToken?: string | null }>,
    shouldRefresh?: (status: number) => boolean,
  },
  debug?: boolean,
  dedupe?: boolean,
  offlineQueue?: boolean,
})
```

## Client methods

### `get(url, config?)`
### `post(url, body?, config?)`
### `put(url, body?, config?)`
### `patch(url, body?, config?)`
### `delete(url, config?)`

All methods return typed response data.

## Upload methods

### `upload(url, uploadConfig, requestConfig?)`

Multipart upload helper.

```ts
await api.upload('/media/upload', {
  files: { uri: 'file:///tmp/photo.jpg', name: 'photo.jpg', type: 'image/jpeg' },
  fields: { folder: 'avatars' },
  fileFieldName: 'file',
});
```

### `uploadLink(url, link, payload?, requestConfig?)`

Posts link-based media payload.

```ts
await api.uploadLink('/media/from-link', 'https://example.com/image.jpg', {
  folder: 'imports',
});
```

### `uploadResumable(url, config, requestConfig?)`

Chunked/resumable upload with progress and retries.

```ts
await api.uploadResumable('/upload/chunk', {
  file: { uri: 'file:///tmp/video.mp4', name: 'video.mp4', type: 'video/mp4' },
  chunkSize: 2 * 1024 * 1024,
  maxRetriesPerChunk: 3,
  onProgress(p) {
    console.log(p.progress);
  },
  finalizeEndpoint: '/upload/finalize',
});
```

## Utility methods

### `invalidate(descriptor?)`
Invalidate cache entries by prefix scope.

### `clearCache()`
Clear all cache entries.

### `clearOfflineQueue()`
Drop pending offline queued requests.

## Error shape

All thrown errors are normalized:

```ts
{
  message: string;
  status: number;
  data?: unknown;
  originalError?: unknown;
}
```
