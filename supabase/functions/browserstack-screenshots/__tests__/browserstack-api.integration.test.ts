import { describe, it, expect, beforeEach } from 'vitest';
import { generateScreenshots, getBrowsers } from '../browserstack-api.js';
import { createValidScreenshotRequest, mockFetch, createMockResponse } from './test-utils.js';

describe('Browserstack API Integration Tests', () => {
  const validInput = createValidScreenshotRequest();
  const credentials = {
    username: process.env.BROWSERSTACK_USERNAME || '',
    password: process.env.BROWSERSTACK_ACCESS_KEY || ''
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should generate screenshots successfully', async () => {
    // Mock browsers response first
    const browsersMock = {
      browsers: [
        {
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: '117.0',
          device: null
        }
      ]
    };

    // Mock screenshots response
    const screenshotsMock = {
      job_id: 'test-job-id',
      state: 'done',
      callback_url: null,
      win_res: '1024x768',
      mac_res: '1024x768',
      quality: 'compressed',
      wait_time: 5,
      screenshots: [{
        id: 'screenshot-1',
        browser: 'chrome',
        browser_version: '117.0',
        os: 'Windows',
        os_version: '10',
        url: 'https://example.com',
        state: 'done',
        created_at: '2024-01-30T16:25:45.000Z'
      }]
    };

    let callCount = 0;
    mockFetch.fn.mockImplementation(async () => {
      callCount++;
      return createMockResponse(200, callCount === 1 ? browsersMock : screenshotsMock);
    });

    const result = await generateScreenshots(validInput, credentials);
    expect(result.job_id).toBeTruthy();
    expect(result.state).toBeDefined();
    expect(result.screenshots).toBeDefined();
    expect(Array.isArray(result.screenshots)).toBe(true);
  });

  it('should handle rate limiting', async () => {
    // Mock browsers response first
    const browsersMock = {
      browsers: [
        {
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: '117.0',
          device: null
        }
      ]
    };

    let callCount = 0;
    mockFetch.fn.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return createMockResponse(200, browsersMock);
      }
      return createMockResponse(429, { message: 'Rate limit exceeded' });
    });

    await expect(
      generateScreenshots(validInput, credentials)
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('should fetch available browsers', async () => {
    const mockResponse = {
      browsers: [
        {
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: '117.0',
          device: null
        }
      ]
    };

    mockFetch.fn.mockImplementation(async () => createMockResponse(200, mockResponse));

    const browsers = await getBrowsers(credentials);
    expect(Array.isArray(browsers)).toBe(true);
    expect(browsers.length).toBeGreaterThan(0);
    expect(browsers[0]).toHaveProperty('os');
    expect(browsers[0]).toHaveProperty('browser');
  });
}); 