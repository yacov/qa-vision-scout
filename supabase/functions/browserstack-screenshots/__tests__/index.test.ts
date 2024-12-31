import { jest } from '@jest/globals';
import { generateScreenshots } from '../browserstack-api';
import type { ScreenshotRequest } from '../browserstack-api';

describe('index', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should be properly configured', () => {
    const validInput: ScreenshotRequest = {
      url: 'https://example.com',
      resolution: 'WINDOWS',
      waitTime: 5,
      browsers: [{ os: 'Windows', os_version: '10', browser: 'chrome', browser_version: '90' }]
    };

    expect(() => generateScreenshots(validInput)).not.toThrow();
  });
}); 