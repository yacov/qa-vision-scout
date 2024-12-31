import { setupIntegrationTest, mockFetch, mockCredentials, createMockResponse } from './test-utils';
import { generateScreenshots } from '../browserstack-api';
import type { ScreenshotRequest } from '../browserstack-api';

describe('Browserstack API Integration Tests', () => {
  beforeEach(() => {
    setupIntegrationTest();
  });

  describe('generateScreenshots', () => {
    it('should handle invalid URL gracefully', async () => {
      const invalidInput: ScreenshotRequest = {
        url: 'invalid-url',
        resolution: 'WINDOWS',
        browsers: [{
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: '90'
        }],
        waitTime: 5
      };

      // Mock error response for invalid URL
      mockFetch.mockImplementationOnce(async () => createMockResponse(400, {
        message: 'Invalid URL format',
        status_code: 400
      }));

      await expect(generateScreenshots(invalidInput, mockCredentials))
        .rejects
        .toThrow('Invalid URL format');
    });

    it('should respect rate limiting', async () => {
      const validInput: ScreenshotRequest = {
        url: 'https://example.com',
        resolution: 'WINDOWS',
        browsers: [{
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: '90'
        }],
        waitTime: 5
      };

      // Mock rate limit response
      mockFetch.mockImplementationOnce(async () => createMockResponse(429, {
        message: 'Rate limit exceeded',
        status_code: 429
      }));

      await expect(generateScreenshots(validInput, mockCredentials))
        .rejects
        .toThrow('Rate limit exceeded');
    });
  });
}); 