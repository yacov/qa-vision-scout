import { describe, it, expect, beforeEach } from 'vitest';
import { generateScreenshots, getBrowsers } from '../browserstack-api.js';
import { createValidScreenshotRequest } from './test-utils.js';
import { BrowserstackError } from '../errors/browserstack-error.js';

const realCredentials = {
  username: 'iakovvolfkovich_F75ojQ',
  password: 'HYAZ4DUHsvFrouzKZqyj'
};

describe('BrowserStack API Integration', () => {
  const validInput = createValidScreenshotRequest();

  // Add delay between tests to avoid rate limiting
  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should fetch available browsers from real API', async () => {
    try {
      const browsers = await getBrowsers(realCredentials, 'test-request-id');
      expect(Array.isArray(browsers), 'browsers should be an array').toBe(true);
      expect(browsers.length, 'browsers array should not be empty').toBeGreaterThan(0);
      
      // Verify browser object structure
      const browser = browsers[0];
      expect(browser).toHaveProperty('os');
      expect(browser).toHaveProperty('os_version');
      expect(browser).toHaveProperty('browser');
      expect(browser).toHaveProperty('browser_version');
    } catch (error: any) {
      if (error instanceof BrowserstackError && error.statusCode === 429) {
        console.log('Skipping test due to rate limiting');
        return;
      }
      throw error;
    }
  });

  it('should generate screenshots using real API', async () => {
    try {
      const result = await generateScreenshots(validInput, realCredentials);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('state');
      expect(Array.isArray(result.screenshots)).toBe(true);

      // If job completed immediately
      if (result.state === 'done') {
        expect(result.screenshots.length).toBeGreaterThan(0);
        const screenshot = result.screenshots[0];
        expect(screenshot).toHaveProperty('browser', 'chrome');
        expect(screenshot).toHaveProperty('image_url');
        expect(screenshot).toHaveProperty('thumb_url');
      }
    } catch (error: any) {
      if (error instanceof BrowserstackError && error.statusCode === 429) {
        console.log('Skipping test due to rate limiting');
        return;
      }
      throw error;
    }
  }, 30000); // Increase timeout for real API call

  it('should handle rate limiting gracefully', async () => {
    // Make multiple rapid requests to trigger rate limiting
    const promises = Array(5).fill(null).map(() => 
      getBrowsers(realCredentials, 'test-request-id')
    );

    try {
      await Promise.all(promises);
      throw new Error('Expected rate limit error');
    } catch (error: any) {
      if (error instanceof BrowserstackError) {
        expect(error.statusCode).toBe(429);
      } else if (error.message === 'Expected rate limit error') {
        throw error;
      } else {
        expect(error.message).toMatch(/429|rate limit/i);
      }
    }
  });
}); 