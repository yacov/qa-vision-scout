import { jest } from '@jest/globals';
import fetch from 'cross-fetch';

interface MockOptions {
  status?: number;
  headers?: Record<string, string>;
}

interface MockResponse {
  ok: boolean;
  status: number;
  headers: Headers;
  json: () => Promise<unknown>;
}

export function mockFetchResponse(data: unknown, options: MockOptions = {}): MockResponse {
  const headers = new Headers({
    'content-type': 'application/json',
    ...(options.headers || {})
  });

  const response = {
    ok: options.status ? options.status >= 200 && options.status < 300 : true,
    status: options.status || 200,
    headers,
    json: async () => data
  } as MockResponse;

  // @ts-ignore - Ignore type checking for test mock
  global.fetch = jest.fn(() => Promise.resolve(response));
  return response;
}

export function setupIntegrationTest(): void {
  // @ts-ignore - Ignore type checking for test setup
  global.fetch = fetch;
}

export const mockRateLimiter = {
  RateLimiter: jest.fn(() => ({
    acquireToken: jest.fn(() => Promise.resolve({ value: undefined }))
  }))
}; 