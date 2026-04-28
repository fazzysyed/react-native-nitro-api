# Cache and Dedupe

## Cache strategy

- Cache applies to `GET` requests.
- Key format: `METHOD::resolvedURL::stable(params)`.
- Supports TTL expiration.
- Supports stale-while-revalidate (SWR).

## Nitro + fallback

- Nitro cache adapter is used when:
  - `react-native-nitro-modules` is installed in the app, and
  - `NitroCache` HybridObject is registered on native side.
- Fallback to JS Map cache is automatic when Nitro is unavailable.

## Dedupe behavior

- In-flight dedupe applies to identical `GET` requests only.
- Non-GET requests are not deduped to avoid side-effect collisions.

## Manual invalidation

```ts
api.invalidate(); // all known cache keys
api.invalidate({ method: 'GET', url: '/users' });
api.clearCache();
```

## SWR notes

When SWR is enabled and a cached entry is stale:

- stale value is returned immediately
- background request refreshes cache asynchronously

Use SWR for low-latency read-heavy screens where eventual freshness is acceptable.
