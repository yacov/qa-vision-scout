import { vi } from 'vitest';
import type { ScreenshotSettings, BrowserConfig } from '../types';
import type { RequestInfo, HeadersInit } from 'node-fetch';
import { Response } from 'node-fetch';

// Mock the database client
vi.mock('../database', () => ({
  createSupabaseClient: vi.fn().mockReturnValue({
    // Add any required mock methods here
  })
}));

// Mock the browserstack-api
type GenerateScreenshotsType = (settings: ScreenshotSettings, authHeader: HeadersInit) => Promise<{
  job_id: string;
  screenshots: Array<{
    id: string;
    state: 'done';
    url: string;
  } & BrowserConfig>;
}>;

const mockGenerateScreenshots = vi.fn((settings: ScreenshotSettings, authHeader: HeadersInit) => {
  // Validate required parameters
  if (!settings.url) {
    throw new Error('Missing required parameter: url');
  }
  if (!Array.isArray(settings.browsers) || settings.browsers.length === 0) {
    throw new Error('Missing required parameter: browsers must be a non-empty array');
  }

  return Promise.resolve({
    job_id: 'test-job-id',
    screenshots: settings.browsers.map((browser: BrowserConfig, index: number) => ({
      id: `screenshot-${index}`,
      state: 'done' as const,
      url: settings.url,
      ...browser
    }))
  });
});

vi.mock('../browserstack-api', () => ({
  generateScreenshots: mockGenerateScreenshots
}));

// Mock the os-config
type NormalizeConfigType = (config: BrowserConfig) => { os: string; os_version: string };

const mockNormalizeOsConfig = vi.fn((config: BrowserConfig) => ({
  os: config.os,
  os_version: config.os_version
}));

vi.mock('../os-config', () => ({
  normalizeOsConfig: mockNormalizeOsConfig
}));

// Mock fetch
const mockResponse = new Response(JSON.stringify({ message: 'Mocked response' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
});

// Use native fetch types
type FetchResponse = globalThis.Response;

const mockFetch = vi.fn<Parameters<typeof fetch>, Promise<FetchResponse>>();

global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
}); 