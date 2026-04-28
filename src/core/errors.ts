import axios, { AxiosError } from 'axios';
import type { APIError } from './types';

export function normalizeError(error: unknown): APIError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return {
      message: axiosError.message || 'Network request failed',
      status: axiosError.response?.status ?? 0,
      data: axiosError.response?.data,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 0,
      originalError: error,
    };
  }

  return {
    message: 'Unknown error',
    status: 0,
    originalError: error,
  };
}
