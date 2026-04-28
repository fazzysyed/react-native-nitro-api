import type { APIClient, RequestConfig } from '../core/types';

interface ResourceConfig<TCreate = unknown, TUpdate = unknown> {
  basePath: string;
  idParamName?: string;
  cacheTTL?: number;
}

export function createResource<TModel = unknown, TCreate = unknown, TUpdate = unknown>(
  api: APIClient,
  config: ResourceConfig<TCreate, TUpdate>,
) {
  const idParamName = config.idParamName ?? 'id';

  return {
    get(id: string | number, requestConfig?: RequestConfig): Promise<TModel> {
      return api.get<TModel>(`${config.basePath}/:${idParamName}`, {
        ...(requestConfig ?? {}),
        routeParams: {
          ...(requestConfig?.routeParams ?? {}),
          [idParamName]: id,
        },
        cache: {
          ...(requestConfig?.cache ?? {}),
          ttl: requestConfig?.cache?.ttl ?? config.cacheTTL,
        },
      });
    },
    list(requestConfig?: RequestConfig): Promise<TModel[]> {
      return api.get<TModel[]>(config.basePath, requestConfig);
    },
    create(body: TCreate, requestConfig?: RequestConfig<TCreate>): Promise<TModel> {
      return api.post<TModel, TCreate>(config.basePath, body, requestConfig);
    },
    update(id: string | number, body: TUpdate, requestConfig?: RequestConfig<TUpdate>): Promise<TModel> {
      return api.put<TModel, TUpdate>(`${config.basePath}/:${idParamName}`, body, {
        ...(requestConfig ?? {}),
        routeParams: {
          ...(requestConfig?.routeParams ?? {}),
          [idParamName]: id,
        },
      });
    },
    remove(id: string | number, requestConfig?: RequestConfig): Promise<void> {
      return api.delete<void>(`${config.basePath}/:${idParamName}`, {
        ...(requestConfig ?? {}),
        routeParams: {
          ...(requestConfig?.routeParams ?? {}),
          [idParamName]: id,
        },
      });
    },
  };
}
