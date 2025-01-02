import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handler } from '../index';
import { generateScreenshots } from '../browserstack-api';
import { BrowserstackError } from '../utils/errors';

vi.mock('../browserstack-api', () => ({
  generateScreenshots: vi.fn()
}));

describe('index', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('process', {
      env: {
        BROWSERSTACK_USERNAME: 'test_user',
        BROWSERSTACK_ACCESS_KEY: 'test_key'
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should handle screenshot generation request', async () => {
    const mockResult = {
      id: '12345678-1234-1234-1234-123456789012',
      state: 'queued'
    };
    (generateScreenshots as any).mockResolvedValue(mockResult);

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: [{
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: '100.0'
        }]
      })
    });

    const response = await handler(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(mockResult);
  });

  it('should handle parallel limit error', async () => {
    (generateScreenshots as any).mockRejectedValue(
      new BrowserstackError('Parallel limit exceeded', 429, '12345678-1234-1234-1234-123456789012')
    );

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com',
        selected_configs: [{
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: '100.0'
        }]
      })
    });

    const response = await handler(request);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.message).toBe('Parallel limit exceeded');
  });

  it('should handle CORS preflight request', async () => {
    const request = new Request('http://localhost', {
      method: 'OPTIONS'
    });

    const response = await handler(request);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });
}); 