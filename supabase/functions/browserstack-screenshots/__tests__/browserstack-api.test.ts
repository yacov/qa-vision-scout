import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateScreenshots, getBrowsers } from '../browserstack-api.js';
import { createValidScreenshotRequest, createInvalidScreenshotRequest, mockFetch, createMockResponse } from './test-utils.js';
import { ResolutionType } from '../types.js';

describe('BrowserStack API', () => {
  const validInput = createValidScreenshotRequest();
  const credentials = {
    username: process.env.BROWSERSTACK_USERNAME || '',
    password: process.env.BROWSERSTACK_ACCESS_KEY || ''
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch available browsers successfully', async () => {
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
    expect(Array.isArray(browsers), 'browsers should be an array').toBe(true);
    expect(browsers.length, 'browsers array should not be empty').toBeGreaterThan(0);
    expect(browsers[0], 'first browser should have os property').toHaveProperty('os');
    expect(browsers[0], 'first browser should have browser property').toHaveProperty('browser');
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
    expect(result.job_id, 'result should have a job_id').toBeTruthy();
    expect(result.state, 'result should have a state').toBeDefined();
    expect(result.screenshots, 'result should have screenshots').toBeDefined();
    expect(Array.isArray(result.screenshots), 'screenshots should be an array').toBe(true);
  });

  it('should reject invalid resolution', async () => {
    const invalidInput = createInvalidScreenshotRequest({ resolution: 'INVALID' as ResolutionType });
    await expect(
      generateScreenshots(invalidInput, credentials)
    ).rejects.toThrow(/Invalid INVALID resolution/);
  });

  it('should reject invalid wait time', async () => {
    const invalidInput = createInvalidScreenshotRequest({ wait_time: 30 as 2 | 5 | 10 | 15 | 20 | 60 });
    await expect(
      generateScreenshots(invalidInput, credentials)
    ).rejects.toThrow(/Invalid wait time/);
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
}); 