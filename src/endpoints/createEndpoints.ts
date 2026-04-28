import type { APIClient, HttpMethod, RequestConfig } from '../core/types';
import { resolveRoute } from '../utils/route';

type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type EndpointDefinition = {
  method: EndpointMethod;
  path: string;
};

type EndpointMap = Record<string, EndpointDefinition>;

type PathParamNames<S extends string> =
  S extends `${string}:${infer Param}/${infer Rest}`
    ? Param | PathParamNames<`/${Rest}`>
    : S extends `${string}:${infer Param}`
      ? Param
      : never;

type RouteParams<Path extends string> = [PathParamNames<Path>] extends [never]
  ? Record<string, never>
  : Record<PathParamNames<Path>, string | number>;

type EndpointFn<Def extends EndpointDefinition> = Def['method'] extends 'GET' | 'DELETE'
  ? <TResponse = unknown>(routeParams: RouteParams<Def['path']>, config?: Omit<RequestConfig, 'routeParams'>) => Promise<TResponse>
  : <TResponse = unknown, TBody = unknown>(
      routeParams: RouteParams<Def['path']>,
      body?: TBody,
      config?: Omit<RequestConfig<TBody>, 'routeParams' | 'data'>,
    ) => Promise<TResponse>;

export type GeneratedEndpoints<Defs extends EndpointMap> = {
  [K in keyof Defs]: EndpointFn<Defs[K]>;
};

export function createEndpoints<Defs extends EndpointMap>(api: APIClient, definitions: Defs): GeneratedEndpoints<Defs> {
  const entries = Object.entries(definitions).map(([name, definition]) => {
    const fn = (async (routeParams: Record<string, string | number>, body?: unknown, config?: RequestConfig) => {
      const path = resolveRoute(definition.path, routeParams);
      const mergedConfig: RequestConfig = {
        ...(config ?? {}),
        routeParams,
      };

      const method = definition.method as HttpMethod;
      if (method === 'GET') {
        return api.get(path, mergedConfig);
      }
      if (method === 'DELETE') {
        return api.delete(path, mergedConfig);
      }
      if (method === 'POST') {
        return api.post(path, body, mergedConfig);
      }
      if (method === 'PUT') {
        return api.put(path, body, mergedConfig);
      }
      return api.patch(path, body, mergedConfig);
    }) as unknown;

    return [name, fn] as const;
  });

  return Object.fromEntries(entries) as GeneratedEndpoints<Defs>;
}
