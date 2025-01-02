import { vi } from 'vitest';

interface Browser {
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  device?: string;
  device_type?: 'desktop' | 'mobile';
}

export function createMockResponse(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createDefaultMockFetch() {
  let pollCount = 0;
  return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/browsers')) {
      return Promise.resolve(createMockResponse(200, {
        browsers: [
          {
            os: 'Windows',
            os_version: '10',
            browser: 'chrome',
            browser_version: '121.0',
            device_type: 'desktop'
          },
          {
            os: 'ios',
            os_version: '17',
            device: 'iPhone 15',
            device_type: 'mobile'
          }
        ]
      }));
    }

    if (url.includes('/screenshots') && !url.includes('/status')) {
      const requestId = '12345678-1234-1234-1234-123456789012';
      return Promise.resolve(createMockResponse(200, {
        id: requestId,
        job_id: requestId,
        state: 'queued',
        callback_url: null,
        screenshots: [
          {
            id: 'screenshot-1',
            state: 'queued'
          },
          {
            id: 'screenshot-2',
            state: 'queued'
          }
        ]
      }));
    }

    if (url.includes('/status')) {
      pollCount++;
      const jobId = url.split('/').pop()?.replace('.json', '') || 'test-job-id';
      const state = pollCount >= 2 ? 'done' : 'processing';
      return Promise.resolve(createMockResponse(200, {
        id: jobId,
        job_id: jobId,
        state,
        callback_url: null,
        screenshots: state === 'done' ? [
          {
            id: 'screenshot-1',
            state: 'done',
            browser: 'chrome',
            browser_version: '121.0',
            os: 'Windows',
            os_version: '10',
            url: 'https://www.browserstack.com/screenshots/abc123/chrome_121.png'
          },
          {
            id: 'screenshot-2',
            state: 'done',
            os: 'ios',
            os_version: '17',
            device: 'iPhone 15',
            url: 'https://www.browserstack.com/screenshots/abc123/iphone15.png'
          }
        ] : [
          {
            id: 'screenshot-1',
            state: 'processing'
          },
          {
            id: 'screenshot-2',
            state: 'processing'
          }
        ]
      }));
    }

    return Promise.resolve(createMockResponse(404, { message: 'Not found' }));
  });
}

export function createRateLimitMock() {
  return vi.fn().mockImplementation(() => {
    return Promise.resolve(createMockResponse(429, {
      message: 'Rate limit exceeded',
      error: 'Too many parallel requests'
    }));
  });
}

export function createTimeoutMock() {
  let pollCount = 0;
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('/status')) {
      pollCount++;
      return Promise.resolve(createMockResponse(200, {
        id: 'timeout-job',
        job_id: 'timeout-job',
        state: 'processing',
        callback_url: null,
        screenshots: [
          {
            id: 'screenshot-1',
            state: 'processing'
          }
        ]
      }));
    }
    return Promise.resolve(createMockResponse(200, {
      id: 'timeout-job',
      job_id: 'timeout-job',
      state: 'queued',
      callback_url: null,
      screenshots: [
        {
          id: 'screenshot-1',
          state: 'queued'
        }
      ]
    }));
  });
}

export function createMockScreenshotResponse(state: string, input: any) {
  const jobId = 'test-job-id';
  return {
    id: jobId,
    job_id: jobId,
    state,
    callback_url: null,
    screenshots: state === 'done' && input.browsers ? input.browsers.map((browser: Browser, index: number) => ({
      id: `screenshot-${index + 1}`,
      state: 'done',
      ...browser,
      url: `https://www.browserstack.com/screenshots/${jobId}/${browser.browser || browser.device}.png`
    })) : input.browsers.map((browser: Browser, index: number) => ({
      id: `screenshot-${index + 1}`,
      state
    }))
  };
} 