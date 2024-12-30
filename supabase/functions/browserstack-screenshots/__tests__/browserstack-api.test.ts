import { generateScreenshots, getAvailableBrowsers } from '../browserstack-api';

const TEST_TIMEOUT = 30000;

describe('BrowserStack Screenshots API Tests', () => {
  describe('getAvailableBrowsers', () => {
    it('should successfully fetch available browsers', async () => {
      const browsers = await getAvailableBrowsers(
        { Authorization: 'Basic dGVzdDp0ZXN0' },
        'test-request-id'
      );
      expect(browsers).toBeDefined();
      expect(Array.isArray(browsers)).toBe(true);
    }, TEST_TIMEOUT);

    it('should handle authentication failure', async () => {
      await expect(
        getAvailableBrowsers(
          { Authorization: 'Basic invalid' },
          'test-auth-failure'
        )
      ).rejects.toThrow('Authentication failed');
    }, TEST_TIMEOUT);
  });

  describe('generateScreenshots', () => {
    it('should successfully generate screenshots', async () => {
      const url = 'https://drsisterskincare.com/products/dark-spot-vanish';
      const browsers = [
        {
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: 'latest',
        },
      ];
      const options = {
        quality: 'compressed' as const,
        waitTime: 5,
      };

      const result = await generateScreenshots(url, browsers, options, 'test-screenshot-gen');
      expect(result).toBeDefined();
    }, TEST_TIMEOUT);

    it('should handle invalid URL', async () => {
      const url = 'invalid-url';
      const browsers = [
        {
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: 'latest',
        },
      ];
      const options = {
        quality: 'compressed' as const,
        waitTime: 5,
      };

      await expect(
        generateScreenshots(url, browsers, options, 'test-invalid-url')
      ).rejects.toThrow('Invalid request parameters');
    }, TEST_TIMEOUT);

    it('should handle invalid browser configuration', async () => {
      const url = 'https://drsisterskincare.com/products/dark-spot-vanish';
      const browsers = [
        {
          os: 'InvalidOS',
          os_version: 'InvalidVersion',
          browser: 'InvalidBrowser',
          browser_version: 'latest',
        },
      ];
      const options = {
        quality: 'compressed' as const,
        waitTime: 5,
      };

      await expect(
        generateScreenshots(url, browsers, options, 'test-invalid-browser')
      ).rejects.toThrow('Invalid request parameters');
    }, TEST_TIMEOUT);

    it('should handle rate limiting', async () => {
      const url = 'https://drsisterskincare.com/products/dark-spot-vanish';
      const browsers = [
        {
          os: 'Windows',
          os_version: '11',
          browser: 'chrome',
          browser_version: 'latest',
        },
      ];
      const options = {
        quality: 'compressed' as const,
        waitTime: 5,
      };

      await expect(
        generateScreenshots(url, browsers, options, 'test-rate-limit')
      ).rejects.toThrow('API rate limit exceeded');
    }, TEST_TIMEOUT);

    it('should validate required parameters', async () => {
      // Test missing URL
      await expect(
        generateScreenshots('', [], {}, 'test-no-url')
      ).rejects.toThrow('Missing required parameter: url');

      // Test missing browsers
      await expect(
        generateScreenshots('https://example.com', [], {}, 'test-no-browsers')
      ).rejects.toThrow('Missing required parameter: browsers must be a non-empty array');

      // Test empty browsers array
      await expect(
        generateScreenshots('https://example.com', [], {}, 'test-empty-browsers')
      ).rejects.toThrow('Missing required parameter: browsers must be a non-empty array');
    }, TEST_TIMEOUT);
  });
}); 