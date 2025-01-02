import { describe, it, expect, beforeEach } from 'vitest';
import { generateScreenshots, getAvailableBrowsers } from '../browserstack-api';
import { createDefaultMockFetch, createRateLimitMock } from './test-utils';
import { WaitTime, BrowserConfig, WindowsResolution } from '../types';

const credentials = {
  username: 'iakovvolfkovich_F75ojQ',
  accessKey: 'HYAZ4DUHsvFrouzKZqyj'
};

const input = {
  url: 'https://drsisterskincare.com/products/dark-spot-vanish',
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
  }, 30000);

  it('should generate screenshots using real API', async () => {
    const result = await generateScreenshots(input, credentials);
    console.log('Screenshot generation result:', JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.job_id).toBeDefined();
    expect(['queued', 'processing', 'done']).toContain(result.state);
    
    if (result.state === 'done' && result.screenshots && result.screenshots.length > 0) {
      const screenshot = result.screenshots[0];
      expect(screenshot).toHaveProperty('id');
      expect(screenshot).toHaveProperty('state');
      expect(['done', 'processing', 'queued']).toContain(screenshot.state);
      
      if (screenshot.state === 'done') {
        expect(screenshot).toHaveProperty('url');
        if (screenshot.url) {
          expect(screenshot.url).toMatch(/^https?:\/\//);
        }
      }
    }
  }, 60000);

  it('should handle rate limiting gracefully', async () => {
    // Use the mock for rate limiting test since we don't want to actually trigger rate limits
    global.fetch = createRateLimitMock();
    await expect(generateScreenshots(input, credentials))
      .rejects.toThrow('Rate limit exceeded');
  }, 30000);
}); 