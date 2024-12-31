import { jest } from '@jest/globals';
import { BrowserstackError, generateScreenshots, getBrowsers, type ScreenshotRequest } from '../browserstack-api';
import { mockFetch } from './test-utils';
import type { Response } from 'node-fetch';

// Mock fetch globally
global.fetch = mockFetch as unknown as typeof fetch;

describe('BrowserStack API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBrowsers', () => {
    it('should fetch available browsers successfully', async () => {
      const mockResponse = [
        { os: 'Windows', os_version: '10', browser: 'chrome', browser_version: '90' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse)
      } as Response);

      const result = await getBrowsers();
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Unauthorized' })
      } as Response);

      await expect(getBrowsers()).rejects.toThrow(BrowserstackError);
    });
  });

  describe('generateScreenshots', () => {
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

    it('should generate screenshots successfully', async () => {
      const mockResponse = {
        job_id: 'test-job-id',
        screenshots: [{
          browser: 'chrome',
          browser_version: '90',
          os: 'Windows',
          os_version: '10',
          url: 'https://example.com',
          thumb_url: 'https://example.com/thumb.jpg',
          image_url: 'https://example.com/image.jpg'
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse)
      } as Response);

      const result = await generateScreenshots(validInput);
      expect(result).toEqual(mockResponse);
    });

    it('should reject invalid resolution', async () => {
      const invalidInput = {
        ...validInput,
        resolution: 'INVALID' as any
      };

      await expect(generateScreenshots(invalidInput)).rejects.toThrow('Invalid INVALID resolution');
    });

    it('should reject invalid wait time', async () => {
      const invalidInput = {
        ...validInput,
        waitTime: 30 as any
      };

      await expect(generateScreenshots(invalidInput)).rejects.toThrow('Invalid wait time');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ message: 'Internal server error' })
      } as Response);

      await expect(generateScreenshots(validInput)).rejects.toThrow('Internal server error');
    });

    it('should handle rate limiting', async () => {
      // Mock fetch to simulate rate limiting
      global.fetch = jest.fn().mockImplementationOnce(async () => ({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({
          message: 'Rate limit exceeded',
          status_code: 429
        })
      } as Response)) as unknown as typeof fetch;

      await expect(generateScreenshots(validInput)).rejects.toThrow('Rate limit exceeded');
    });
  });
}); 