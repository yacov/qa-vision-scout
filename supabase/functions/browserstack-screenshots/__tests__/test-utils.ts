import { jest } from '@jest/globals';
import type { Response } from 'node-fetch';

export const mockCredentials = {
  username: 'test-user',
  password: 'test-pass'
};

export const mockFetch = jest.fn<() => Promise<Response>>();

export function setupIntegrationTest() {
  // Clear any existing mocks
  jest.clearAllMocks();
  
  // Set up global fetch mock
  global.fetch = mockFetch as unknown as typeof fetch;
  
  // Set up default mock response for successful requests
  mockFetch.mockImplementation(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      job_id: 'test-job-id',
      screenshots: [{
        browser: 'chrome',
        browser_version: '90',
        os: 'Windows',
        os_version: '10',
        url: 'https://example.com',
        thumb_url: 'https://example.com/thumb.jpg',
        image_url: 'https://example.com/image.jpg'
      }]
    })
  } as Response));
}

export function createMockResponse(status: number, data: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data),
    json: async () => data
  } as Response;
} 