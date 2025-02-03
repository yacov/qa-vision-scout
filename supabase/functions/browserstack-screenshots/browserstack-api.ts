import { logger } from './utils/logger.ts';
import { BrowserstackError } from './errors/browserstack-error.ts';

interface BrowserConfig {
  device_type: 'mobile' | 'desktop';
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

export async function generateScreenshots(input: any, credentials: any) {
  const { username, accessKey } = credentials;
  const { url, selected_configs } = input;

  if (!username || !accessKey) {
    logger.error({
      message: 'BrowserStack credentials missing',
      username: !!username,
      accessKey: !!accessKey
    });
    throw new Error('BrowserStack credentials not configured');
  }

  logger.info({
    message: 'Starting screenshot generation',
    url,
    browserCount: selected_configs.length
  });

  try {
    const auth = btoa(`${username}:${accessKey}`);
    
    // Format payload according to BrowserStack API specs
    const browsers = selected_configs.map((config: BrowserConfig) => {
      const browser: Record<string, any> = {
        os: config.os?.toLowerCase(),
        os_version: config.os_version?.toString()
      };

      if (config.device_type === 'mobile') {
        browser.device = config.device;
        // For Android, we need to use specific version format
        if (browser.os === 'android') {
          // Convert version number to match BrowserStack format (e.g., 14.0)
          browser.os_version = browser.os_version.includes('.') ? 
            browser.os_version : 
            `${browser.os_version}.0`;
        }
        browser.orientation = 'portrait';  // Default to portrait mode
      } else {
        browser.browser = config.browser?.toLowerCase();
        browser.browser_version = config.browser_version;
        browser.resolution = '1920x1080';
      }

      // Clean up any undefined values
      Object.keys(browser).forEach(key => {
        if (browser[key] === undefined) {
          delete browser[key];
        }
      });

      return browser;
    });

    const payload = {
      url: encodeURI(url),
      browsers,
      wait_time: 5,
      quality: 'compressed'
    };

    logger.info({
      message: 'BrowserStack API request payload',
      payload
    });

    const response = await fetch('https://www.browserstack.com/screenshots', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Log the raw response for debugging
    const responseText = await response.text();
    logger.info({
      message: 'BrowserStack API raw response',
      status: response.status,
      statusText: response.statusText,
      responseText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      throw new BrowserstackError(
        `BrowserStack API error: ${response.status} ${response.statusText}`,
        response.status,
        'request-id',
        { responseText }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText || '{}');
    } catch (error) {
      logger.error({
        message: 'Failed to parse BrowserStack API response',
        error: error instanceof Error ? error.message : String(error),
        responseText
      });
      throw new Error('Invalid JSON response from BrowserStack API');
    }

    logger.info({
      message: 'Screenshot generation queued',
      jobId: result.job_id,
      url
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'Screenshot generation failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url
    });
    throw error;
  }
}