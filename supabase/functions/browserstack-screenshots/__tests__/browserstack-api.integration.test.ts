import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch available browsers', async () => {
    const mockResponse = [
      {
        os: 'ios',
        os_version: '17',
        browser: 'Mobile Safari',
        browser_version: null,
        device: 'iPhone 15'
      }
    ];

    mockFetch.fn.mockImplementation(async () => createMockResponse(200, mockResponse));

    const browsers = await getBrowsers(credentials, 'test-request-id');
    expect(Array.isArray(browsers)).toBe(true);
    expect(browsers.length).toBeGreaterThan(0);
    expect(browsers[0]).toHaveProperty('os', 'ios');
    expect(browsers[0]).toHaveProperty('device', 'iPhone 15');
  });

  it('should generate screenshots with polling', async () => {
    // Mock browsers response
    const browsersMock = [
      {
        os: 'ios',
        os_version: '17',
        browser: 'Mobile Safari',
        browser_version: null,
        device: 'iPhone 15'
      }
    ];

    // Mock initial response
    const initialResponse = {
      id: 'test-job-id',
      state: 'queued_all',
      callback_url: null,
      win_res: '1024x768',
      mac_res: '1024x768',
      quality: 'compressed',
      wait_time: 5,
      orientation: 'portrait',
      screenshots: [{
        id: 'screenshot-1',
        browser: 'Mobile Safari',
        browser_version: null,
        os: 'ios',
        os_version: '17',
        url: 'https://example.com',
        state: 'processing',
        image_url: null,
        thumb_url: null,
        device: 'iPhone 15',
        orientation: 'portrait',
        created_at: '2024-01-30T16:25:45.000Z'
      }],
      stopped: false
    };

    // Mock completion response
    const completionResponse = {
      ...initialResponse,
      state: 'done',
      screenshots: [{
        ...initialResponse.screenshots[0],
        state: 'done',
        image_url: 'https://www.browserstack.com/screenshots/test-job-id/17_iPhone-15_portrait_real-mobile.jpg',
        thumb_url: 'https://www.browserstack.com/screenshots/test-job-id/thumb_17_iPhone-15_portrait_real-mobile.jpg'
      }]
    };

    let callCount = 0;
    mockFetch.fn.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return createMockResponse(200, browsersMock);
      if (callCount === 2) return createMockResponse(200, initialResponse);
      return createMockResponse(200, completionResponse);
    });

    const resultPromise = generateScreenshots(validInput, credentials);
    
    // Fast-forward time to simulate polling (2 minutes total)
    for (let i = 0; i < 12; i++) {
      await vi.advanceTimersByTimeAsync(10000); // 10 seconds each
    }
    
    const result = await resultPromise;
    expect(result.id).toBeTruthy();
    expect(result.state).toBe('done');
    expect(result.screenshots[0].image_url).toMatch(/17_iPhone-15_portrait_real-mobile\.jpg$/);
  });

  it('should handle rate limiting', async () => {
    // Mock browsers response first
    const browsersMock = [
      {
        os: 'ios',
        os_version: '17',
        browser: 'Mobile Safari',
        browser_version: null,
        device: 'iPhone 15'
      }
    ];

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