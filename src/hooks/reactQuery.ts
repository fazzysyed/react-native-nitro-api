import { useMemo } from 'react';
import type { APIClient, RequestConfig } from '../core/types';

type QueryKey = readonly unknown[];

interface QueryClientLike {
  invalidateQueries: (args: { queryKey: QueryKey }) => Promise<unknown> | unknown;
}

interface ReactQueryModule {
  useQuery: <T>(config: { queryKey: QueryKey; queryFn: () => Promise<T> } & Record<string, unknown>) => unknown;
  useMutation: <TData, TVariables>(config: { mutationFn: (variables: TVariables) => Promise<TData> } & Record<string, unknown>) => unknown;
}

function getReactQuery(): ReactQueryModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    return require('@tanstack/react-query') as ReactQueryModule;
  } catch {
    throw new Error('React Query hooks requested but @tanstack/react-query is not installed.');
  }
}

type EndpointCall<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

export function createQueryHooks(api: APIClient) {
  return {
    useAPIQuery<TResponse = unknown>(queryKey: QueryKey, request: () => Promise<TResponse>, options?: Record<string, unknown>) {
      const { useQuery } = getReactQuery();
      return useQuery<TResponse>({
        queryKey,
        queryFn: request,
        ...(options ?? {}),
      });
    },

    useEndpointQuery<TArgs extends unknown[], TResult>(
      keyFactory: (...args: TArgs) => QueryKey,
      endpoint: EndpointCall<TArgs, TResult>,
      args: TArgs,
      options?: Record<string, unknown>,
    ) {
      const { useQuery } = getReactQuery();
      const queryKey = useMemo(() => keyFactory(...args), args);
      return useQuery<TResult>({
        queryKey,
        queryFn: () => endpoint(...args),
        ...(options ?? {}),
      });
    },

    useAPIMutation<TResponse = unknown, TVariables = unknown>(
      request: (variables: TVariables) => Promise<TResponse>,
      options?: Record<string, unknown>,
    ) {
      const { useMutation } = getReactQuery();
      return useMutation<TResponse, TVariables>({
        mutationFn: request,
        ...(options ?? {}),
      });
    },

    invalidate(queryClient: QueryClientLike, key: QueryKey) {
      return queryClient.invalidateQueries({ queryKey: key });
    },

    invalidateRequest(url: string, config?: RequestConfig) {
      api.invalidate({ method: 'GET', url, params: config?.params });
    },
  };
}
