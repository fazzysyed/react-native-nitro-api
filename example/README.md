# Nitro API Example (Native)

This is a real React Native iOS/Android app used to test `react-native-nitro-api` locally.

## What it tests

- Basic GET request
- Dynamic route param replacement
- Request deduplication (`Promise.all` same request)
- Normalized error shape

## Run

1. Install dependencies:

```sh
npm install
```

2. Start Metro:

```sh
npm start
```

3. Run Android:

```sh
npm run android
```

4. Run iOS:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

## Notes

- The app uses `https://jsonplaceholder.typicode.com` for safe test traffic.
- Debug logs are enabled in `App.tsx` via `createAPI({ debug: true })`.
