# Troubleshooting

## Module resolution error in example app

Symptom:

- `Unable to resolve module react-native-nitro-api` in Metro

Fix:

1. Ensure `example/metro.config.js` points `extraNodeModules` to workspace root.
2. Restart Metro with cache reset:

```sh
cd example
npx react-native start --reset-cache
```

## iOS build fails with fmt consteval errors

Symptom:

- C++ build fails in `Pods/fmt/include/fmt/format-inl.h`

Fix:

- Use the Podfile workaround already included in `example/ios/Podfile`.
- Re-run:

```sh
cd example/ios
bundle exec pod install
```

## npm publish fails with auth error

Symptom:

- `ENEEDAUTH`

Fix:

```sh
npm adduser
npm publish --access public
```

## Nitro module unavailable

Symptom:

- Native Nitro cache path not active

Behavior:

- Library automatically falls back to JS cache.
- This is expected and safe.

## Upload cancellation not working

Ensure you pass `AbortSignal` in request config:

```ts
const controller = new AbortController();
await api.uploadResumable('/upload/chunk', config, { signal: controller.signal });
controller.abort();
```
