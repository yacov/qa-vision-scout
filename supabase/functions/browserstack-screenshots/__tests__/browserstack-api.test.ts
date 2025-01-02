import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateScreenshots, getAvailableBrowsers } from '../browserstack-api';
import { createDefaultMockFetch, createRateLimitMock, createTimeoutMock } from './test-utils';
import { BrowserConfig } from '../types';

const credentials = {
  username: 'test-user',
  accessKey: 'test-key'
};

const input = {
  url: 'https://example.com',
  browsers: [
    {
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: '121.0',
      device_type: 'desktop'
    },
    {
      os: 'ios',
      os_version: '17',
      device: 'iPhone 15',
      device_type: 'mobile'
    }
  ] as BrowserConfig[]
};

const inputWithCallback = {
  ...input,
  callback_url: 'https://example.com/callback'
};

describe('BrowserStack API', () => {
  beforeEach(() => {
    global.fetch = createDefaultMockFetch();
  });

  it('should fetch available browsers successfully', async () => {
    const result = await getAvailableBrowsers(credentials);
    expect(result).toBeDefined();
    expect(result.browsers).toBeDefined();
    expect(result.browsers.length).toBeGreaterThan(0);
  }, 30000);

  it('should handle parallel limit error gracefully', async () => {
    global.fetch = createRateLimitMock();
    await expect(generateScreenshots(input, credentials)).rejects.toThrow('Rate limit exceeded');
  }, 30000);

  it('should generate screenshots successfully with callback URL', async () => {
    const result = await generateScreenshots(inputWithCallback, credentials);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.job_id).toBeDefined();
    expect(result.state).toBe('queued');
  }, 30000);

  it('should poll for completion when no callback URL is provided', async () => {
    const result = await generateScreenshots(input, credentials);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.job_id).toBeDefined();
    expect(result.state).toBe('done');
    expect(result.screenshots).toHaveLength(2);
    
    // Verify screenshot details
    const [desktopShot, mobileShot] = result.screenshots;
    expect(desktopShot.browser).toBe('chrome');
    expect(desktopShot.os).toBe('Windows');
    expect(mobileShot.device).toBe('iPhone 15');
    expect(mobileShot.os).toBe('ios');
  }, 60000);

  it('should throw error if polling times out', async () => {
    global.fetch = createTimeoutMock();
    await expect(generateScreenshots(input, credentials, { maxPolls: 3, pollInterval: 100 }))
      .rejects.toThrow('Polling timeout exceeded');
  }, 60000);
}); 