# react-native-nitro-api

Production-grade, Nitro-ready API client for React Native.

`react-native-nitro-api` combines:

- TypeScript-first API ergonomics
- Axios-based HTTP transport
- Optional Nitro (JSI/C++) cache acceleration
- Safe fallback to JS-only mode when Nitro is unavailable

## Why this library

- Minimal API surface for app teams
- Strong defaults (timeouts, normalized errors, dedupe/caching)
- Production-oriented auth refresh workflow
- Upload support including resumable/chunked flows
- Optional React Query helpers for DX

## Install

### Base install (works everywhere)

```sh
npm install react-native-nitro-api
```

### Enable Nitro native acceleration (recommended)

To use the native Nitro cache path, install Nitro Modules in your app too:

```sh
npm install react-native-nitro-modules
cd ios && pod install
```

Without this dependency, the library still works and falls back to JS cache automatically.

## Quick start

```ts
import { createAPI } from 'react-native-nitro-api';

const api = createAPI({
  baseURL: 'https://api.example.com',
});

const user = await api.get('/users/:id', {
  routeParams: { id: 42 },
});
```

## Core features

- Typed `get/post/put/patch/delete`
- Route params + query params
- Error normalization
- GET cache with TTL + stale-while-revalidate
- In-flight deduplication for identical GET requests
- Bearer auth + refresh-on-401 (retry once)
- Offline queue (in-memory)
- Multipart upload + link upload + resumable uploads

## Docs

- [API Reference](docs/api.md)
- [Auth Guide](docs/auth.md)
- [Cache and Dedupe](docs/cache-dedupe.md)
- [Uploads](docs/uploads.md)
- [Resumable Upload Contract](docs/resumable-upload-contract.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Changelog](docs/changelog.md)

## Optional Nitro behavior

Nitro is optional by design.

- If `react-native-nitro-modules` is installed and `NitroCache` HybridObject is registered, cache uses native Nitro path.
- If Nitro is not available (or not registered), library automatically falls back to JS Map cache.
- No runtime crash should occur due to missing Nitro module.

## Example app

A native iOS/Android test app is included under `example/`:

```sh
cd example
npm install
npm start
# in another terminal
npm run ios
# or
npm run android
```

## License

MIT
