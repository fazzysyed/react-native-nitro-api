import { createAPI } from '../core/client';

jest.mock('axios', () => {
  const request = jest.fn();
  const create = jest.fn(() => ({ request }));
  const isAxiosError = jest.fn((error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError));
  return {
    __esModule: true,
    default: { create, isAxiosError },
  };
});

const axios = jest.requireMock('axios').default as {
  create: jest.Mock;
  isAxiosError: jest.Mock;
};

const requestMock = () => (axios.create.mock.results[0].value as { request: jest.Mock }).request;

function makeAxiosError(status: number, message = 'Request failed') {
  return {
    isAxiosError: true,
    message,
    response: {
      status,
      data: { reason: 'failed' },
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createAPI core behavior', () => {
  beforeEach(() => {
    axios.create.mockClear();
  });

  it('normalizes errors from failed requests', async () => {
    const api = createAPI({ baseURL: 'https://api.test' });
    requestMock().mockRejectedValueOnce(makeAxiosError(500, 'Server exploded'));

    await expect(api.get('/boom')).rejects.toMatchObject({
      message: 'Server exploded',
      status: 500,
      data: { reason: 'failed' },
    });
  });

  it('deduplicates identical in-flight requests', async () => {
    const api = createAPI({ baseURL: 'https://api.test' });
    const pending = deferred<{ status: number; data: { ok: boolean } }>();
    requestMock().mockReturnValueOnce(pending.promise);

    const p1 = api.get<{ ok: boolean }>('/users/:id', { routeParams: { id: 1 } });
    const p2 = api.get<{ ok: boolean }>('/users/:id', { routeParams: { id: 1 } });

    pending.resolve({ status: 200, data: { ok: true } });

    await expect(Promise.all([p1, p2])).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(requestMock()).toHaveBeenCalledTimes(1);
  });

  it('serves cached GET results before network', async () => {
    const api = createAPI({ baseURL: 'https://api.test' });
    requestMock().mockResolvedValueOnce({ status: 200, data: { id: 1 } });

    const first = await api.get<{ id: number }>('/items/1');
    const second = await api.get<{ id: number }>('/items/1');

    expect(first).toEqual({ id: 1 });
    expect(second).toEqual({ id: 1 });
    expect(requestMock()).toHaveBeenCalledTimes(1);
  });

  it('refreshes token after 401 and retries once', async () => {
    const storage = {
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
    };

    const api = createAPI({
      baseURL: 'https://api.test',
      auth: {
        storage: {
          getAccessToken: async () => storage.accessToken,
          getRefreshToken: async () => storage.refreshToken,
          setTokens: async ({ accessToken, refreshToken }) => {
            storage.accessToken = accessToken;
            storage.refreshToken = refreshToken ?? storage.refreshToken;
          },
          clearTokens: async () => {
            storage.accessToken = '';
            storage.refreshToken = '';
          },
        },
        refreshToken: async () => ({ accessToken: 'new-token' }),
      },
    });

    requestMock()
      .mockRejectedValueOnce(makeAxiosError(401, 'Unauthorized'))
      .mockResolvedValueOnce({ status: 200, data: { secure: true } });

    const result = await api.get<{ secure: boolean }>('/secure');

    expect(result).toEqual({ secure: true });
    expect(requestMock()).toHaveBeenCalledTimes(2);
    expect(requestMock().mock.calls[1][0].headers.Authorization).toBe('Bearer new-token');
  });
});
