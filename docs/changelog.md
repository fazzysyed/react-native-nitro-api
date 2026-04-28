# Changelog

## 0.1.0

Initial public release.

### Added

- Typed API client factory with `get/post/put/patch/delete`
- Error normalization pipeline
- Dynamic route parameter resolution
- GET cache with TTL and SWR
- Optional Nitro cache adapter + JS fallback cache
- In-flight GET request deduplication
- Auth bearer injection + refresh-on-401 flow
- Offline queue (in-memory)
- Endpoint helpers (`createEndpoints`, `createResource`, `createNamespace`)
- Optional React Query helpers
- Multipart upload helper (`upload`)
- Link upload helper (`uploadLink`)
- Resumable/chunked upload (`uploadResumable`)
- Native example app for iOS/Android testing
- Jest test harness for core/upload behaviors
