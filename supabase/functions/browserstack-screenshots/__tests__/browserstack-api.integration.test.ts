import { getAvailableBrowsers, generateScreenshots } from '../browserstack-api';
import { setupIntegrationTest } from './test-utils';

interface BrowserstackCredentials {
  username: string;
  password: string;
}

const getCredentials = (): BrowserstackCredentials => {
  const username = process.env.BROWSERSTACK_USERNAME;
  const password = process.env.BROWSERSTACK_ACCESS_KEY;

  if (!username || !password) {
    throw new Error('BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables must be set');
  }

  console.log('Using credentials:', { username });
  return { username, password };
};

describe('Browserstack API Integration Tests', () => {
  let credentials: BrowserstackCredentials;

  beforeAll(() => {
    setupIntegrationTest();
    try {
      credentials = getCredentials();
    } catch (error) {
      console.error('Failed to get credentials:', error);
      throw error;
    }
  });

  describe('getAvailableBrowsers', () => {
    it('should fetch real browser list from Browserstack', async () => {
      try {
        const browsers = await getAvailableBrowsers(credentials, 'integration-test');
        
        expect(browsers).toBeDefined();
        expect(browsers.desktop).toBeInstanceOf(Array);
        expect(browsers.mobile).toBeInstanceOf(Array);
        expect(browsers.desktop.length).toBeGreaterThan(0);
        expect(browsers.mobile.length).toBeGreaterThan(0);

        // Validate browser object structure
        const desktopBrowser = browsers.desktop[0];
        expect(desktopBrowser).toHaveProperty('os');
        expect(desktopBrowser).toHaveProperty('os_version');
        expect(desktopBrowser).toHaveProperty('browser');
        expect(desktopBrowser).toHaveProperty('browser_version');

        const mobileBrowser = browsers.mobile[0];
        expect(mobileBrowser).toHaveProperty('os');
        expect(mobileBrowser).toHaveProperty('os_version');
        expect(mobileBrowser).toHaveProperty('device');
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });
  });

  describe('generateScreenshots', () => {
    const testUrl = 'https://www.example.com';
    
    it('should generate screenshots for desktop and mobile browsers', async () => {
      // Get available browsers first
      const browsers = await getAvailableBrowsers(credentials, 'integration-test');
      
      // Select one desktop and one mobile browser for testing
      const desktopBrowser = {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        browser_version: 'latest',
      };
      const mobileBrowser = {
        os: 'ios',
        os_version: '16',
        device: 'iPhone 14',
        realMobile: true,
      };

      const result = await generateScreenshots(
        testUrl,
        [desktopBrowser, mobileBrowser],
        credentials,
        {
          quality: 'compressed',
          waitTime: 5,
          orientation: 'portrait',
          callbackUrl: 'https://example.com/callback',
          macResolution: '1920x1080',
          windowsResolution: '1920x1080',
          local: false
        },
        'integration-test'
      );

      expect(result).toBeDefined();
      expect(result.job_id).toBeDefined();
      expect(result.screenshots).toBeInstanceOf(Array);
      expect(result.screenshots.length).toBe(2);

      // Validate screenshot objects
      result.screenshots.forEach(screenshot => {
        expect(screenshot).toHaveProperty('url');
        expect(screenshot).toHaveProperty('os');
        expect(screenshot).toHaveProperty('os_version');
      });
    }, 30000); // Increase timeout for API call

    it('should handle invalid URL gracefully', async () => {
      await expect(generateScreenshots(
        'invalid-url',
        [{
          os: 'Windows',
          os_version: '10',
          browser: 'chrome',
          browser_version: 'latest',
        }],
        credentials,
        {
          quality: 'compressed',
          waitTime: 5,
          orientation: 'portrait',
          callbackUrl: 'https://example.com/callback',
          macResolution: '1920x1080',
          windowsResolution: '1920x1080',
          local: false
        },
        'integration-test'
      )).rejects.toThrow();
    });

    it('should respect rate limiting', async () => {
      // Make multiple concurrent requests
      const requests = Array(3).fill(null).map(() => 
        generateScreenshots(
          testUrl,
          [{
            os: 'Windows',
            os_version: '10',
            browser: 'chrome',
            browser_version: 'latest',
          }],
          credentials,
          {
            quality: 'compressed',
            waitTime: 5,
            orientation: 'portrait',
            callbackUrl: 'https://example.com/callback',
            macResolution: '1920x1080',
            windowsResolution: '1920x1080',
            local: false
          },
          'integration-test'
        )
      );

      await expect(Promise.all(requests)).resolves.toBeDefined();
    }, 45000); // Increase timeout for multiple API calls
  });
}); 