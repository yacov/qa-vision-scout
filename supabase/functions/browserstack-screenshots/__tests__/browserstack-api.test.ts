import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateScreenshots, getBrowsers } from '../browserstack-api.js';
import { createValidScreenshotRequest, mockFetch, createMockResponse } from './test-utils.js';
import { BrowserstackError } from '../errors/browserstack-error.js';

describe('BrowserStack API', () => {
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

  it('should fetch available browsers successfully', async () => {
    const mockResponse = [
      {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: '121.0',
        device: null
      },
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
    expect(Array.isArray(browsers), 'browsers should be an array').toBe(true);
    expect(browsers.length, 'browsers array should not be empty').toBeGreaterThan(0);
    expect(browsers[0], 'first browser should have os property').toHaveProperty('os');
    expect(browsers[1], 'mobile device should have device property').toHaveProperty('device');
  });

  it('should generate screenshots successfully with callback URL', async () => {
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

    // Mock screenshots response
    const screenshotsMock = {
      id: 'test-job-id',
      state: 'queued_all',
      callback_url: 'http://example.com/callback',
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

    let callCount = 0;
    mockFetch.fn.mockImplementation(async () => {
      callCount++;
      return createMockResponse(200, callCount === 1 ? browsersMock : screenshotsMock);
    });

    const result = await generateScreenshots({
      ...validInput,
      callback_url: 'http://example.com/callback'
    }, credentials);

    expect(result.id, 'result should have an id').toBeTruthy();
    expect(result.state).toBe('queued_all');
    expect(result.screenshots[0].device).toBe('iPhone 15');
    expect(result.screenshots[0].browser).toBe('Mobile Safari');
    expect(mockFetch.fn).toHaveBeenCalledTimes(2); // Only initial calls, no polling
  });

  it('should poll for completion when no callback URL is provided', async () => {
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

    // Mock processing response
    const processingResponse = {
      ...initialResponse,
      screenshots: [{
        ...initialResponse.screenshots[0],
        state: 'processing'
      }]
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
      if (callCount === 3) return createMockResponse(200, processingResponse);
      return createMockResponse(200, completionResponse);
    });

    const resultPromise = generateScreenshots(validInput, credentials);
    
    // Fast-forward time to simulate polling (2 minutes total)
    for (let i = 0; i < 12; i++) {
      await vi.advanceTimersByTimeAsync(10000); // 10 seconds each
    }
    
    const result = await resultPromise;

    expect(result.state).toBe('done');
    expect(result.screenshots[0].state).toBe('done');
    expect(result.screenshots[0].image_url).toMatch(/17_iPhone-15_portrait_real-mobile\.jpg$/);
    expect(result.screenshots[0].thumb_url).toMatch(/thumb_17_iPhone-15_portrait_real-mobile\.jpg$/);
    expect(mockFetch.fn).toHaveBeenCalledTimes(4); // Initial calls + 2 polls
  });

  it('should throw error if polling times out', async () => {
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

    // Mock processing response
    const processingResponse = {
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

    let apiCallCount = 0;
    mockFetch.fn.mockImplementation(async () => {
      apiCallCount++;
      if (apiCallCount === 1) {
        return createMockResponse(200, browsersMock);
      }
      if (apiCallCount === 2) {
        return createMockResponse(200, processingResponse);
      }
      return createMockResponse(200, processingResponse);
    });

    const resultPromise = generateScreenshots(validInput, credentials);
    
    // Fast-forward time for exactly 30 polls (5 minutes)
    for (let i = 0; i < 30; i++) {
      await vi.advanceTimersByTimeAsync(10000); // 10 seconds each
    }
    
    try {
      await resultPromise;
    } catch (error) {
      expect((error as BrowserstackError).message).toBe('Screenshot generation timed out after 5 minutes');
      expect(mockFetch.fn).toHaveBeenCalledTimes(32); // Initial call + screenshot generation + 30 polls
    }
  });

  it('should handle error state in screenshot generation', async () => {
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

    // Mock error response
    const errorResponse = {
      id: 'test-job-id',
      state: 'error',
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
        state: 'error',
        image_url: null,
        thumb_url: null,
        device: 'iPhone 15',
        orientation: 'portrait',
        created_at: '2024-01-30T16:25:45.000Z'
      }],
      stopped: false
    };

    let apiCallCount = 0;
    mockFetch.fn.mockImplementation(async () => {
      apiCallCount++;
      if (apiCallCount === 1) return createMockResponse(200, browsersMock);
      if (apiCallCount === 2) return createMockResponse(200, { ...errorResponse, state: 'queued_all' });
      return createMockResponse(200, errorResponse);
    });

    const resultPromise = generateScreenshots(validInput, credentials);
    
    // Fast-forward time to first poll
    await vi.advanceTimersByTimeAsync(10000);
    
    await expect(resultPromise).rejects.toThrow('Screenshot generation failed');
    expect(mockFetch.fn).toHaveBeenCalledTimes(3); // Initial call + 1 poll + error state
  });

  it('should validate browser configurations', async () => {
    const browsersMock = [
      {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: '121.0',
        device: null
      }
    ];

    mockFetch.fn.mockImplementation(async () => createMockResponse(200, browsersMock));

    // Test invalid OS
    await expect(generateScreenshots({
      ...validInput,
      browsers: [{
        os: 'invalid-os',
        os_version: '10'
      }]
    }, credentials)).rejects.toThrow('No matching browser configuration found');

    // Test invalid device
    await expect(generateScreenshots({
      ...validInput,
      browsers: [{
        os: 'ios',
        os_version: '17',
        device: 'invalid-device'
      }]
    }, credentials)).rejects.toThrow('No matching browser configuration found');

    // Test missing required OS field
    await expect(generateScreenshots({
      ...validInput,
      browsers: [{ 
        os: '',
        os_version: '10',
        browser: 'chrome'
      }]
    }, credentials)).rejects.toThrow('OS is a required field');
  });

  it('should validate resolution settings', async () => {
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
    mockFetch.fn.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (url.toString().includes('browsers.json')) {
        return createMockResponse(200, browsersMock);
      }
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      
      if (url.toString().includes('screenshots.json')) {
        return createMockResponse(200, {
          id: 'test-job-id',
          state: 'queued_all',
          callback_url: null,
          win_res: '1024x768',
          mac_res: '1024x768',
          quality: body.quality || 'compressed',
          wait_time: 5,
          orientation: body.orientation || 'portrait',
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
            orientation: body.orientation || 'portrait',
            created_at: '2024-01-30T16:25:45.000Z'
          }],
          stopped: false
        });
      }
      
      return createMockResponse(200, {
        id: 'test-job-id',
        state: 'done',
        callback_url: null,
        win_res: '1024x768',
        mac_res: '1024x768',
        quality: body.quality || 'compressed',
        wait_time: 5,
        orientation: body.orientation || 'portrait',
        screenshots: [{
          id: 'screenshot-1',
          browser: 'Mobile Safari',
          browser_version: null,
          os: 'ios',
          os_version: '17',
          url: 'https://example.com',
          state: 'done',
          image_url: 'https://example.com/image.jpg',
          thumb_url: 'https://example.com/thumb.jpg',
          device: 'iPhone 15',
          orientation: body.orientation || 'portrait',
          created_at: '2024-01-30T16:25:45.000Z'
        }],
        stopped: false
      });
    });

    // Test invalid Windows resolution
    await expect(generateScreenshots({
      ...validInput,
      win_res: '800x600'
    }, credentials)).rejects.toThrow('Invalid Windows resolution');

    // Test invalid Mac resolution
    await expect(generateScreenshots({
      ...validInput,
      mac_res: '800x600'
    }, credentials)).rejects.toThrow('Invalid Mac resolution');
  });

  it('should validate wait time settings', async () => {
    const browsersMock = [
      {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: '121.0',
        device: null
      }
    ];

    mockFetch.fn.mockImplementation(async () => createMockResponse(200, browsersMock));

    // Test invalid wait time
    await expect(generateScreenshots({
      ...validInput,
      wait_time: 3
    }, credentials)).rejects.toThrow('Invalid wait time');
  });

  it('should validate credentials', async () => {
    // Test missing credentials
    await expect(getBrowsers({
      username: '',
      password: ''
    }, 'test-request-id')).rejects.toThrow('Missing Browserstack credentials');

    // Test invalid credentials
    mockFetch.fn.mockImplementation(async () => createMockResponse(401, { message: 'Invalid credentials' }));
    await expect(getBrowsers({
      username: 'invalid',
      password: 'invalid'
    }, 'test-request-id')).rejects.toThrow('Browserstack API error');
  });

  it('should handle different screenshot quality settings', async () => {
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
    mockFetch.fn.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (url.toString().includes('browsers.json')) {
        return createMockResponse(200, browsersMock);
      }
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const quality = body.quality || 'compressed';
      
      if (url.toString().includes('screenshots.json')) {
        return createMockResponse(200, {
          id: 'test-job-id',
          state: 'queued_all',
          callback_url: null,
          win_res: '1024x768',
          mac_res: '1024x768',
          quality: body.quality || 'compressed',
          wait_time: 5,
          orientation: body.orientation || 'portrait',
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
            orientation: body.orientation || 'portrait',
            created_at: '2024-01-30T16:25:45.000Z'
          }],
          stopped: false
        });
      }
      
      return createMockResponse(200, {
        id: 'test-job-id',
        state: 'done',
        callback_url: null,
        win_res: '1024x768',
        mac_res: '1024x768',
        quality: body.quality || 'compressed',
        wait_time: 5,
        orientation: body.orientation || 'portrait',
        screenshots: [{
          id: 'screenshot-1',
          browser: 'Mobile Safari',
          browser_version: null,
          os: 'ios',
          os_version: '17',
          url: 'https://example.com',
          state: 'done',
          image_url: 'https://example.com/image.jpg',
          thumb_url: 'https://example.com/thumb.jpg',
          device: 'iPhone 15',
          orientation: body.orientation || 'portrait',
          created_at: '2024-01-30T16:25:45.000Z'
        }],
        stopped: false
      });
    });

    // Test compressed quality
    const compressedPromise = generateScreenshots({
      ...validInput,
      quality: 'compressed'
    }, credentials);

    // Fast-forward time to simulate polling
    await vi.advanceTimersByTimeAsync(10000);

    const compressedResult = await compressedPromise;
    expect(compressedResult.quality).toBe('compressed');

    // Test original quality
    const originalPromise = generateScreenshots({
      ...validInput,
      quality: 'original'
    }, credentials);

    // Fast-forward time to simulate polling
    await vi.advanceTimersByTimeAsync(10000);

    const originalResult = await originalPromise;
    expect(originalResult.quality).toBe('original');
  });

  it('should handle different orientation settings', async () => {
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
    mockFetch.fn.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (url.toString().includes('browsers.json')) {
        return createMockResponse(200, browsersMock);
      }
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const orientation = body.orientation || 'portrait';
      const quality = body.quality || 'compressed';
      
      if (url.toString().includes('screenshots.json')) {
        return createMockResponse(200, {
          id: 'test-job-id',
          state: 'queued_all',
          callback_url: null,
          win_res: '1024x768',
          mac_res: '1024x768',
          quality,
          wait_time: 5,
          orientation: orientation,
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
            orientation: orientation,
            created_at: '2024-01-30T16:25:45.000Z'
          }],
          stopped: false
        });
      }
      
      return createMockResponse(200, {
        id: 'test-job-id',
        state: 'done',
        callback_url: null,
        win_res: '1024x768',
        mac_res: '1024x768',
        quality,
        wait_time: 5,
        orientation: orientation,
        screenshots: [{
          id: 'screenshot-1',
          browser: 'Mobile Safari',
          browser_version: null,
          os: 'ios',
          os_version: '17',
          url: 'https://example.com',
          state: 'done',
          image_url: 'https://example.com/image.jpg',
          thumb_url: 'https://example.com/thumb.jpg',
          device: 'iPhone 15',
          orientation: orientation,
          created_at: '2024-01-30T16:25:45.000Z'
        }],
        stopped: false
      });
    });

    // Test portrait orientation
    const portraitPromise = generateScreenshots({
      ...validInput,
      orientation: 'portrait'
    }, credentials);

    // Fast-forward time to simulate polling
    await vi.advanceTimersByTimeAsync(10000);

    const portraitResult = await portraitPromise;
    expect(portraitResult.orientation).toBe('portrait');
    expect(portraitResult.screenshots[0].orientation).toBe('portrait');

    // Test landscape orientation
    const landscapePromise = generateScreenshots({
      ...validInput,
      orientation: 'landscape'
    }, credentials);

    // Fast-forward time to simulate polling
    await vi.advanceTimersByTimeAsync(10000);

    const landscapeResult = await landscapePromise;
    expect(landscapeResult.orientation).toBe('landscape');
    expect(landscapeResult.screenshots[0].orientation).toBe('landscape');
  });
}); 