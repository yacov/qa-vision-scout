import { vi } from 'vitest';
import type { ScreenshotRequest } from '../browserstack-api.js';

export const mockCredentials = {
  username: 'test_user',
  password: 'test_key'
};

const defaultMockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return new Response(JSON.stringify({ message: 'Default mock response' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const mockFetch = {
  fn: vi.fn(defaultMockFetch),
  mockReset() {
    this.fn.mockReset();
    this.fn.mockImplementation(defaultMockFetch);
  },
  mockResolvedValueOnce(value: Response) {
    return this.fn.mockResolvedValueOnce(value);
  }
};

export function createMockResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createValidScreenshotRequest(): ScreenshotRequest {
  return {
    url: 'https://example.com',
    resolution: 'WINDOWS',
    browsers: [{
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: '117.0'
    }],
    wait_time: 5,
    quality: 'compressed'
  };
}

export function createInvalidScreenshotRequest(overrides: Partial<ScreenshotRequest> = {}): ScreenshotRequest {
  return {
    ...createValidScreenshotRequest(),
    ...overrides
  };
}

export function validateAuthHeader(headers: Record<string, string>): boolean {
  const authHeader = headers['Authorization'];
  if (!authHeader) return false;

  const [type, credentials] = authHeader.split(' ');
  if (type !== 'Basic') return false;

  const decoded = Buffer.from(credentials, 'base64').toString();
  const [username, password] = decoded.split(':');

  return username === mockCredentials.username && password === mockCredentials.password;
} 