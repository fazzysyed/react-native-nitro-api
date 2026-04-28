# Auth Guide

## Goals

- Inject bearer token automatically
- Refresh on `401`
- Retry original request exactly once
- Avoid refresh storm via single-flight refresh

## Configure auth

```ts
import { createAPI, InMemoryTokenStorage } from 'react-native-nitro-api';

const storage = new InMemoryTokenStorage();

const api = createAPI({
  baseURL: 'https://api.example.com',
  auth: {
    storage,
    refreshToken: async ({ refreshToken }) => {
      // Call your refresh endpoint
      const response = await fetch('https://api.example.com/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    },
  },
});
```

## Behavior

1. Request sends `Authorization: Bearer <access-token>` when available.
2. If response is `401`, refresh flow is attempted.
3. If refresh succeeds, original request retries once.
4. If refresh fails, error is thrown and tokens can be cleared.

## Recommended production setup

- Use secure storage-backed `TokenStorage` implementation.
- Keep refresh endpoint fast and idempotent.
- Ensure backend invalidates old refresh tokens if rotating.
- Log refresh failures to monitoring.
