import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateScreenshots, getBrowsers } from '../browserstack-api.js';
import { createValidScreenshotRequest, mockFetch, createMockResponse, createMockScreenshotResponse } from './test-utils.js';

const mockCredentials = {
  username: 'test-user',
  password: 'test-pass'
};

describe('BrowserStack API', () => {
  const validInput = createValidScreenshotRequest();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch available browsers successfully', async () => {
    mockFetch.fn.mockImplementationOnce(async () => createMockResponse(200, [{
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: 'latest',
      device: null,
      real_mobile: false
    }]));

    const browsers = await getBrowsers(mockCredentials, 'test-request-id');
    expect(Array.isArray(browsers), 'browsers should be an array').toBe(true);
    expect(browsers.length, 'browsers array should not be empty').toBeGreaterThan(0);
    expect(browsers[0], 'first browser should be Windows').toHaveProperty('os', 'Windows');
    expect(browsers[0], 'first browser should be Chrome').toHaveProperty('browser', 'chrome');
  });

  it('should handle parallel limit error gracefully', async () => {
    mockFetch.fn.mockImplementationOnce(async () => createMockResponse(422, {
      message: 'Parallel limit reached',
      running_sessions: 1
    }));

    await expect(generateScreenshots(validInput, mockCredentials))
      .rejects
      .toThrow('Parallel limit reached');
  });

  it('should generate screenshots successfully with callback URL', async () => {
    const mockResponse = createMockScreenshotResponse({
      ...validInput,
      callback_url: 'https://example.com/callback'
    });

    mockFetch.fn.mockImplementationOnce(async () => createMockResponse(200, mockResponse));

    const result = await generateScreenshots({
      ...validInput,
      callback_url: 'https://example.com/callback'
    }, mockCredentials);

    expect(result.id).toBe('test-job-id');
    expect(result.callback_url).toBe(undefined); // BrowserStack API doesn't echo back callback_url
    expect(result.screenshots).toHaveLength(1);
    expect(result.screenshots[0]).toHaveProperty('browser', 'chrome');
  });

  it('should poll for completion when no callback URL is provided', async () => {
    mockFetch.fn
      .mockImplementationOnce(async () => createMockResponse(200, createMockScreenshotResponse(validInput, 'queued')))
      .mockImplementationOnce(async () => createMockResponse(200, createMockScreenshotResponse(validInput, 'processing')))
      .mockImplementationOnce(async () => createMockResponse(200, createMockScreenshotResponse(validInput, 'done')));

    const resultPromise = generateScreenshots(validInput, mockCredentials);
    
    // Fast-forward through polling delays
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(1000);
    }

    const result = await resultPromise;
    expect(result.id).toBe('test-job-id');
    expect(result.state).toBe('done');
    expect(result.screenshots).toHaveLength(1);
    expect(result.screenshots[0]).toHaveProperty('browser', 'chrome');
  });

  it('should throw error if polling times out', async () => {
    mockFetch.fn.mockImplementation(async () => createMockResponse(200, createMockScreenshotResponse(validInput, 'processing')));

    const resultPromise = generateScreenshots(validInput, mockCredentials);

    // Fast-forward past the timeout
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000);

    await expect(resultPromise).rejects.toThrow('Polling timeout exceeded');
  });
}); 