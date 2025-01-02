import { vi } from 'vitest';
import type { ScreenshotRequest, Browser } from '../types/api-types';

export const mockFetch = {
  fn: vi.fn(async (url: string, options?: RequestInit) => {
    // Default mock response
    return new Response(JSON.stringify({ error: 'No mock response configured' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }),
  mockReset: () => {
    mockFetch.fn.mockReset();
    mockFetch.fn.mockImplementation(async (url: string, options?: RequestInit) => {
      return new Response(JSON.stringify({ error: 'No mock response configured' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  }
};

export function createValidScreenshotRequest(): ScreenshotRequest {
  return {
    url: 'https://example.com',
    browsers: [{
      browser: 'chrome',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '10',
      device: undefined
    }],
    wait_time: 5,
    callback_url: undefined
  };
}

export function createMockResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createMockScreenshotResponse(input: any, state: 'queued' | 'processing' | 'done' = 'done') {
  const response = {
    id: 'test-job-id',
    callback_url: undefined,
    state,
    screenshots: []
  };

  if (state === 'done') {
    response.screenshots = input.browsers.map((browser: Browser) => ({
      ...browser,
      url: input.url,
      thumb_url: 'https://example.com/thumb.jpg',
      image_url: 'https://example.com/image.jpg',
      created_at: new Date().toISOString()
    }));
  }

  return response;
} 