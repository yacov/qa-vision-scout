import { describe, it, expect, beforeEach } from 'vitest';
import { generateScreenshots, getAvailableBrowsers } from '../browserstack-api';
import { createDefaultMockFetch, createRateLimitMock } from './test-utils';
import { WaitTime, BrowserConfig, WindowsResolution } from '../types';

const credentials = {
  username: 'test_user',
  accessKey: 'test_key'
};

const input = {
  url: 'https://example.com',
  browsers: [
    {
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: '121.0',
      device_type: 'desktop' as const
    },
    {
      os: 'ios',
      os_version: '17',
      device: 'iPhone 15',
      device_type: 'mobile' as const
    }
  ] as BrowserConfig[],
  quality: 'original' as const,
  wait_time: 10 as WaitTime,
  win_res: '1920x1080' as WindowsResolution,
  orientation: 'portrait' as const
};

describe('BrowserStack API Integration', () => {
  beforeEach(() => {
    global.fetch = createDefaultMockFetch();
  });

  it('should fetch available browsers successfully from real API', async () => {
    const result = await getAvailableBrowsers(credentials);
    console.log('Available browsers:', JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    expect(result.browsers).toBeDefined();
    expect(Array.isArray(result.browsers)).toBe(true);
    expect(result.browsers.length).toBeGreaterThan(0);
    
    // Validate browser object structure
    const browser = result.browsers[0];
    expect(browser).toHaveProperty('os');
    expect(browser).toHaveProperty('os_version');
    expect(browser).toHaveProperty('browser');
    expect(browser).toHaveProperty('browser_version');
  }, 5000);

  it('should generate screenshots using real API', async () => {
    const result = await generateScreenshots({
      ...input,
      callback_url: 'https://example.com/callback'
    }, credentials);
    console.log('Screenshot generation result:', JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.job_id).toBeDefined();
    expect(result.state).toBe('queued');
    
    expect(result.screenshots).toBeDefined();
    expect(result.screenshots.length).toBeGreaterThan(0);
    expect(result.screenshots[0]).toHaveProperty('id');
    expect(result.screenshots[0]).toHaveProperty('state');
    expect(result.screenshots[0].state).toBe('queued');
  }, 1000);

  it('should handle rate limiting gracefully', async () => {
    global.fetch = createRateLimitMock();
    await expect(generateScreenshots(input, credentials))
      .rejects.toThrow('Rate limit exceeded');
  }, 5000);
}); 