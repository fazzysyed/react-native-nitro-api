export function createNamespace<T extends Record<string, unknown>>(namespace: T): T {
  return namespace;
}
