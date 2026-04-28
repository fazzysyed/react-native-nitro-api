export function resolveRoute(path: string, routeParams?: Record<string, string | number>): string {
  if (!routeParams) {
    return path;
  }

  return path.replace(/:([A-Za-z0-9_]+)/g, (match, key: string) => {
    const value = routeParams[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing route param: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}
