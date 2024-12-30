import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateScreenshots, getAvailableBrowsers } from '../browserstack-api';

// Test configuration
const TEST_URL = process.env.TEST_URL || 'https://example.com';
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '120000', 10);

const TEST_BROWSERS = [
  {
    os: 'Windows',
    os_version: '11',
    browser: 'chrome',
    browser_version: 'latest'
  },
  {
    os: 'OS X',
    os_version: 'Monterey',
    browser: 'safari',
    browser_version: 'latest'
  },
  {
    os: 'ios',
    os_version: '16',
    device: 'iPhone 14'
  }
];

describe('BrowserStack Screenshots API Tests', () => {
  let authHeader: HeadersInit;

  beforeEach(() => {
    // Setup authentication header
    if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY) {
      throw new Error('BrowserStack credentials not found in environment variables');
    }

    const authString = Buffer.from(
      `${process.env.BROWSERSTACK_USERNAME}:${process.env.BROWSERSTACK_ACCESS_KEY}`
    ).toString('base64');
    
    authHeader = {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    };

    // Setup fetch mock
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    })) as unknown as typeof fetch;
  });

  describe('getAvailableBrowsers', () => {
    it('should successfully fetch available browsers', async () => {
      const mockBrowsers = [
        {
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: 'latest'
        }
      ];

      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBrowsers)
      }));

      const browsers = await getAvailableBrowsers(authHeader, 'test-request-id');
      expect(Array.isArray(browsers)).toBe(true);
      expect(browsers.length).toBeGreaterThan(0);
      
      const browser = browsers[0];
      expect(browser).toHaveProperty('os');
      expect(browser).toHaveProperty('os_version');
      expect(browser).toHaveProperty('browser');
      expect(browser).toHaveProperty('browser_version');
    }, TEST_TIMEOUT);

    it('should handle authentication failure', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      }));

      const invalidAuthHeader = {
        'Authorization': 'Basic invalid_token',
        'Content-Type': 'application/json'
      };

      await expect(getAvailableBrowsers(invalidAuthHeader, 'test-auth-failure'))
        .rejects
        .toThrow('Authentication failed');
    }, TEST_TIMEOUT);
  });

  describe('generateScreenshots', () => {
    it('should successfully generate screenshots', async () => {
      const mockJobId = 'test-job-id';
      const mockScreenshots = [
        {
          id: 'screenshot-1',
          state: 'done',
          url: TEST_URL,
          thumb_url: 'https://example.com/thumb.jpg',
          image_url: 'https://example.com/image.jpg'
        }
      ];

      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            callCount === 1
              ? { job_id: mockJobId, screenshots: mockScreenshots }
              : { state: 'done', screenshots: mockScreenshots }
          )
        });
      });

      const settings = {
        url: TEST_URL,
        browsers: TEST_BROWSERS,
        quality: 'compressed' as const,
        wait_time: 5 as const,
        win_res: '1920x1080' as const,
        mac_res: '1920x1080' as const,
        orientation: 'portrait' as const
      };

      const result = await generateScreenshots(settings, authHeader, 'test-screenshot-gen');
      
      expect(result).toHaveProperty('job_id');
      expect(result).toHaveProperty('screenshots');
      expect(Array.isArray(result.screenshots)).toBe(true);
      
      const screenshot = result.screenshots[0];
      expect(screenshot).toHaveProperty('id');
      expect(screenshot).toHaveProperty('state');
      expect(screenshot).toHaveProperty('url');
    }, TEST_TIMEOUT);

    it('should handle invalid URL', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 422,
        text: () => Promise.resolve('Invalid URL format')
      }));

      const settings = {
        url: 'invalid-url',
        browsers: TEST_BROWSERS,
        quality: 'compressed' as const,
        wait_time: 5 as const
      };

      await expect(generateScreenshots(settings, authHeader, 'test-invalid-url'))
        .rejects
        .toThrow('Invalid request parameters');
    }, TEST_TIMEOUT);

    it('should handle invalid browser configuration', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 422,
        text: () => Promise.resolve('Invalid browser configuration')
      }));

      const settings = {
        url: TEST_URL,
        browsers: [{
          os: 'InvalidOS',
          os_version: 'InvalidVersion',
          browser: 'InvalidBrowser',
          browser_version: 'latest'
        }],
        quality: 'compressed' as const,
        wait_time: 5 as const
      };

      await expect(generateScreenshots(settings, authHeader, 'test-invalid-browser'))
        .rejects
        .toThrow('Invalid request parameters');
    }, TEST_TIMEOUT);

    it('should handle rate limiting', async () => {
      const settings = {
        url: TEST_URL,
        browsers: [TEST_BROWSERS[0]],
        quality: 'compressed' as const,
        wait_time: 5 as const
      };

      // Mock rate limit error
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      }));

      await expect(generateScreenshots(settings, authHeader, 'test-rate-limit'))
        .rejects
        .toThrow('API rate limit exceeded');
    }, TEST_TIMEOUT);

    it('should validate required parameters', async () => {
      // Test missing URL
      const settingsNoUrl = {
        browsers: TEST_BROWSERS,
        quality: 'compressed' as const,
        wait_time: 5 as const
      };
      await expect(generateScreenshots(settingsNoUrl as any, authHeader, 'test-no-url'))
        .rejects
        .toThrow('Missing required parameter: url');

      // Test missing browsers
      const settingsNoBrowsers = {
        url: TEST_URL,
        quality: 'compressed' as const,
        wait_time: 5 as const
      };
      await expect(generateScreenshots(settingsNoBrowsers as any, authHeader, 'test-no-browsers'))
        .rejects
        .toThrow('Missing required parameter: browsers must be a non-empty array');

      // Test empty browsers array
      const settingsEmptyBrowsers = {
        url: TEST_URL,
        browsers: [],
        quality: 'compressed' as const,
        wait_time: 5 as const
      };
      await expect(generateScreenshots(settingsEmptyBrowsers, authHeader, 'test-empty-browsers'))
        .rejects
        .toThrow('Missing required parameter: browsers must be a non-empty array');
    }, TEST_TIMEOUT);
  });
}); 