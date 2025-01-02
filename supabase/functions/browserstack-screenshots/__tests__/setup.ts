import { vi, beforeEach } from 'vitest';
import type { Browser, ScreenshotRequest, ScreenshotResponse } from '../types/api-types';
import type { HeadersInit } from 'node-fetch';

// Mock the database client
vi.mock('../database', () => ({
  createSupabaseClient: vi.fn().mockReturnValue({
    // Add any required mock methods here
  })
}));

// Mock the browserstack-api
type GenerateScreenshotsType = (request: ScreenshotRequest, credentials: { username: string; password: string }) => Promise<ScreenshotResponse>;

const mockGenerateScreenshots = vi.fn((request: ScreenshotRequest) => {
  // Validate required parameters
  if (!request.url) {
    throw new Error('Missing required parameter: url');
  }
  if (!Array.isArray(request.browsers) || request.browsers.length === 0) {
    throw new Error('Missing required parameter: browsers must be a non-empty array');
  }

  return Promise.resolve({
    id: 'test-job-id',
    state: 'done',
    callback_url: null,
    win_res: request.win_res || '1024x768',
    mac_res: request.mac_res || '1024x768',
    quality: request.quality || 'compressed',
    wait_time: request.wait_time || 5,
    orientation: request.orientation || 'portrait',
    screenshots: request.browsers.map((browser: Browser, index: number) => ({
      id: `screenshot-${index}`,
      browser: browser.browser || 'Mobile Safari',
      browser_version: browser.browser_version || null,
      os: browser.os,
      os_version: browser.os_version,
      url: request.url,
      state: 'done',
      image_url: `https://www.browserstack.com/screenshots/test-job-id/${browser.os_version}_${browser.device || 'desktop'}_${request.orientation || 'portrait'}_real-mobile.jpg`,
      thumb_url: `https://www.browserstack.com/screenshots/test-job-id/thumb_${browser.os_version}_${browser.device || 'desktop'}_${request.orientation || 'portrait'}_real-mobile.jpg`,
      device: browser.device || null,
      orientation: request.orientation || 'portrait',
      created_at: new Date().toISOString()
    })),
    stopped: false
  });
});

vi.mock('../browserstack-api', () => ({
  generateScreenshots: mockGenerateScreenshots
}));

// Mock fetch
const mockResponse = new Response(JSON.stringify({ message: 'Mocked response' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
});

const mockFetch = vi.fn<Parameters<typeof fetch>, Promise<Response>>();

global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(mockResponse);
});

// Mock Deno global
const mockDeno = {
  serve: vi.fn((handler) => {
    // Store the handler for testing
    mockDeno._handler = handler;
    return {
      shutdown: vi.fn()
    };
  }),
  env: {
    get: vi.fn((key: string) => {
      switch (key) {
        case 'BROWSERSTACK_USERNAME':
          return 'test-username';
        case 'BROWSERSTACK_ACCESS_KEY':
          return 'test-access-key';
        default:
          return undefined;
      }
    })
  },
  // Store the handler for testing
  _handler: null as ((req: Request) => Promise<Response>) | null
};

// @ts-ignore: mock Deno global
globalThis.Deno = mockDeno;

// Mock crypto for UUID generation
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: vi.fn(() => 'test-uuid'),
    // Add other required crypto methods as needed
  } as unknown as Crypto;
}

// Mock btoa if not available
if (!globalThis.btoa) {
  globalThis.btoa = (str: string) => Buffer.from(str).toString('base64');
} 