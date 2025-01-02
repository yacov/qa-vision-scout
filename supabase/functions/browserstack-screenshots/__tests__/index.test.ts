import { describe, it, expect, beforeEach } from 'vitest';
import '../index.js';
import { createValidScreenshotRequest, mockFetch, createMockResponse } from './test-utils.js';

describe('index', () => {
  const validInput = createValidScreenshotRequest();

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should handle screenshot generation request', async () => {
    // Mock browsers response first
    const browsersMock = [
      {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: '117.0',
        device: null
      }
    ];

    // Mock screenshots response
    const screenshotsMock = {
      id: 'test-job-id',
      state: 'done',
      callback_url: null,
      win_res: '1024x768',
      mac_res: '1024x768',
      quality: 'compressed',
      wait_time: 5,
      orientation: 'portrait',
      screenshots: [{
        id: 'screenshot-1',
        browser: 'chrome',
        browser_version: '117.0',
        os: 'Windows',
        os_version: '10',
        url: 'https://example.com',
        state: 'done',
        image_url: 'https://www.browserstack.com/screenshots/test-job-id/screenshot-1.jpg',
        thumb_url: 'https://www.browserstack.com/screenshots/test-job-id/thumb_screenshot-1.jpg',
        created_at: '2024-01-30T16:25:45.000Z'
      }]
    };

    let callCount = 0;
    mockFetch.fn.mockImplementation(async () => {
      callCount++;
      return createMockResponse(200, callCount === 1 ? browsersMock : screenshotsMock);
    });

    // @ts-ignore: access mock handler
    const handler = globalThis.Deno._handler;
    expect(handler).toBeDefined();

    const response = await handler(new Request('http://localhost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validInput)
    }));

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.id).toBe('test-job-id');
    expect(result.state).toBe('done');
    expect(result.screenshots).toHaveLength(1);
    expect(result.screenshots[0].image_url).toBeDefined();
  });

  it('should handle CORS preflight request', async () => {
    // @ts-ignore: access mock handler
    const handler = globalThis.Deno._handler;
    expect(handler).toBeDefined();

    const response = await handler(new Request('http://localhost', {
      method: 'OPTIONS'
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
}); 