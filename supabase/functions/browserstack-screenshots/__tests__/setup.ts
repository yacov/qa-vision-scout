import { jest } from '@jest/globals';
import type { ScreenshotSettings, BrowserConfig } from '../types';

// Mock the database client
jest.mock('../database', () => ({
  createSupabaseClient: jest.fn().mockReturnValue({
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

const mockGenerateScreenshots = jest.fn((settings: ScreenshotSettings, authHeader: HeadersInit) => {
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
}) as unknown as jest.MockedFunction<GenerateScreenshotsType>;

jest.mock('../browserstack-api', () => ({
  generateScreenshots: mockGenerateScreenshots
}));

// Mock the os-config
type NormalizeConfigType = (config: BrowserConfig) => { os: string; os_version: string };

const mockNormalizeOsConfig = jest.fn((config: BrowserConfig) => ({
  os: config.os,
  os_version: config.os_version
})) as unknown as jest.MockedFunction<NormalizeConfigType>;

jest.mock('../os-config', () => ({
  normalizeOsConfig: mockNormalizeOsConfig
}));

// Mock fetch
const mockResponse = new Response(JSON.stringify({ message: 'Mocked response' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
});

type FetchType = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const mockFetch = jest.fn(async () => mockResponse) as unknown as jest.MockedFunction<FetchType>;

// Set up global fetch mock
global.fetch = mockFetch; 