import { jest } from '@jest/globals';
import type { mockFetchResponse } from './test-utils';

jest.mock('node-fetch');

interface BrowserstackCredentials {
  username: string;
  password: string;
}

interface BrowserConfig {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface ScreenshotOptions {
  quality?: 'compressed' | 'original';
  waitTime?: number;
}

const mockCredentials: BrowserstackCredentials = {
  username: 'test-user',
  password: 'test-key'
};

const mockBrowsersResponse = {
  desktop: [
    { os: 'Windows', os_version: '10', browser: 'chrome', browser_version: '100.0' }
  ],
  mobile: [
    { os: 'ios', os_version: '15', device: 'iPhone 13' }
  ]
};

const mockScreenshotResponse = {
  job_id: 'test-job-id',
  screenshots: [
    { browser: 'chrome', browser_version: '100.0', os: 'Windows', os_version: '10', url: 'https://test.com' }
  ]
};

describe('browserstack-api', () => {
  let mockFetchResponse: typeof import('./test-utils').mockFetchResponse;
  let getAvailableBrowsers: (credentials: BrowserstackCredentials, requestId: string) => Promise<typeof mockBrowsersResponse>;
  let generateScreenshots: (url: string, browsers: BrowserConfig[], credentials: BrowserstackCredentials, options: ScreenshotOptions, requestId: string) => Promise<typeof mockScreenshotResponse>;

  beforeEach(() => {
    jest.resetModules();
    mockFetchResponse = require('./test-utils').mockFetchResponse;
    const api = require('../browserstack-api');
    getAvailableBrowsers = api.getAvailableBrowsers;
    generateScreenshots = api.generateScreenshots;
  });

  describe('getAvailableBrowsers', () => {
    it('should fetch and return available browsers', async () => {
      mockFetchResponse(mockBrowsersResponse);
      
      const browsers = await getAvailableBrowsers(mockCredentials, 'test-request-id');
      
      expect(browsers).toEqual(mockBrowsersResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/browsers'),
        expect.any(Object)
      );
    });

    it('should throw error on API failure', async () => {
      mockFetchResponse({ message: 'API Error' }, { status: 500 });
      
      await expect(getAvailableBrowsers(mockCredentials, 'test-error-id')).rejects.toThrow('Failed to fetch available browsers');
    });
  });

  describe('generateScreenshots', () => {
    const mockConfig = {
      browsers: [
        { os: 'Windows', os_version: '10', browser: 'chrome', browser_version: '100.0' }
      ] as BrowserConfig[],
      orientation: 'portrait' as const,
      url: 'https://test.com'
    };

    const mockOptions: ScreenshotOptions = {
      quality: 'compressed',
      waitTime: 5
    };

    it('should generate screenshots successfully', async () => {
      mockFetchResponse(mockScreenshotResponse);
      
      const result = await generateScreenshots(
        mockConfig.url,
        mockConfig.browsers,
        mockCredentials,
        mockOptions,
        'test-screenshot-id'
      );
      
      expect(result).toEqual(mockScreenshotResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/generate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });

    it('should throw error on API failure', async () => {
      mockFetchResponse({ message: 'API Error' }, { status: 500 });
      
      await expect(generateScreenshots(
        mockConfig.url,
        mockConfig.browsers,
        mockCredentials,
        mockOptions,
        'test-error-id'
      )).rejects.toThrow('Failed to generate screenshots');
    });
  });
}); 