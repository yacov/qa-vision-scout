import { describe, it, expect, beforeEach } from 'vitest';
import { mockFetch, createMockScreenshotResponse } from './test-utils';

// Get the mock Deno object with the correct type
const mockDeno = globalThis.Deno as unknown as {
  _handler: ((req: Request) => Promise<Response>) | null;
  serve: (handler: (req: Request) => Promise<Response>) => { shutdown: () => void };
  env: { get: (key: string) => string | undefined };
};

describe('index', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should handle screenshot generation request', async () => {
    const validRequest = {
      url: 'https://example.com',
      selected_configs: [{
        browser: 'chrome',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '10'
      }],
      wait_time: 5
    };

    mockFetch.fn.mockImplementationOnce(async () => {
      return new Response(JSON.stringify(createMockScreenshotResponse({
        url: validRequest.url,
        browsers: validRequest.selected_configs
      })), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const response = await mockDeno._handler!(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequest)
    }));

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.id).toBe('test-job-id');
    expect(result.state).toBe('done');
    expect(result.screenshots).toHaveLength(1);
  });

  it('should handle parallel limit error', async () => {
    const validRequest = {
      url: 'https://example.com',
      selected_configs: [{
        browser: 'chrome',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '10'
      }],
      wait_time: 5
    };

    mockFetch.fn.mockImplementationOnce(async () => {
      return new Response(JSON.stringify({
        message: 'Parallel limit reached',
        running_sessions: 1
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const response = await mockDeno._handler!(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequest)
    }));

    expect(response.status).toBe(422);
    const result = await response.json();
    expect(result.error).toBe('Parallel limit reached');
  });

  it('should handle CORS preflight request', async () => {
    const response = await mockDeno._handler!(new Request('http://localhost', {
      method: 'OPTIONS'
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('authorization, x-client-info, apikey, content-type');
  });
}); 