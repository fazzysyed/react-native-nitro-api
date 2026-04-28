export interface Logger {
  debug(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export function createLogger(enabled: boolean): Logger {
  return {
    debug(message, meta) {
      if (!enabled || typeof __DEV__ === 'undefined' || !__DEV__) {
        return;
      }
      // eslint-disable-next-line no-console
      console.debug(`[react-native-nitro-api] ${message}`, meta ?? '');
    },
    error(message, meta) {
      if (!enabled || typeof __DEV__ === 'undefined' || !__DEV__) {
        return;
      }
      // eslint-disable-next-line no-console
      console.error(`[react-native-nitro-api] ${message}`, meta ?? '');
    },
  };
}
