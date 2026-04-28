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
};

const requestMock = () => (axios.create.mock.results[0].value as { request: jest.Mock }).request;

describe('upload features', () => {
  beforeEach(() => {
    axios.create.mockClear();
    jest.restoreAllMocks();
  });

  it('builds multipart upload request', async () => {
    const api = createAPI({ baseURL: 'https://api.test' });
    requestMock().mockResolvedValueOnce({ status: 200, data: { uploaded: true } });

    const result = await api.upload<{ uploaded: boolean }>('/media/upload', {
      files: { uri: 'file:///tmp/photo.jpg', name: 'photo.jpg', type: 'image/jpeg' },
      fields: { folder: 'avatars', public: true },
    });

    expect(result).toEqual({ uploaded: true });
    expect(requestMock()).toHaveBeenCalledTimes(1);
    expect(requestMock().mock.calls[0][0].headers['Content-Type']).toBe('multipart/form-data');
    expect(requestMock().mock.calls[0][0].data).toBeInstanceOf(FormData);
  });

  it('uploads in chunks and reports progress', async () => {
    const api = createAPI({ baseURL: 'https://api.test' });
    const progressSpy = jest.fn();

    requestMock()
      .mockResolvedValueOnce({ status: 200, data: { chunk: 0 } })
      .mockResolvedValueOnce({ status: 200, data: { chunk: 1 } })
      .mockResolvedValueOnce({ status: 200, data: { chunk: 2 } })
      .mockResolvedValueOnce({ status: 200, data: { finalized: true } });

    const data = 'hello world!'; // 12 bytes
    const blob = new Blob([data], { type: 'text/plain' });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    } as Response);
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, configurable: true });

    const result = await api.uploadResumable('/upload/chunk', {
      file: { uri: 'file:///tmp/video.txt', name: 'video.txt', type: 'text/plain' },
      chunkSize: 5,
      onProgress: progressSpy,
      finalizeEndpoint: '/upload/finalize',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestMock()).toHaveBeenCalledTimes(4);
    expect(progressSpy).toHaveBeenCalledTimes(3);
    expect(result.totalChunks).toBe(3);
    expect(result.totalBytes).toBe(12);
  });

  it('supports upload cancellation before first chunk', async () => {
    const api = createAPI({ baseURL: 'https://api.test' });
    const controller = new AbortController();
    controller.abort();

    const blob = new Blob(['cancel me'], { type: 'text/plain' });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    } as Response);
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, configurable: true });

    await expect(
      api.uploadResumable(
        '/upload/chunk',
        {
          file: { uri: 'file:///tmp/cancel.txt', name: 'cancel.txt', type: 'text/plain' },
          chunkSize: 4,
        },
        { signal: controller.signal },
      ),
    ).rejects.toThrow('Upload cancelled');

    expect(requestMock()).toHaveBeenCalledTimes(0);
  });
});
