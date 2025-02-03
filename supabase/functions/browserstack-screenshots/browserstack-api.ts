import { logger } from './utils/logger.ts';
import { BrowserstackError } from './errors/browserstack-error.ts';

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
    const payload = {
      url,
      browsers: selected_configs.map(config => {
        const browser = {
          os: config.os.toLowerCase(),
          os_version: config.os_version,
          device: config.device,
        };

        // Add specific fields based on device type
        if (config.device_type === 'mobile') {
          if (config.os.toLowerCase() === 'android') {
            return {
              ...browser,
              browser: 'samsung',  // Required for Android devices
              orientation: 'portrait'
            };
          } else if (config.os.toLowerCase() === 'ios') {
            return {
              ...browser,
              browser: 'Mobile Safari',  // Required for iOS devices
              orientation: 'portrait'
            };
          }
        } else {
          // Desktop configuration
          return {
            ...browser,
            browser: config.browser?.toLowerCase(),
            browser_version: config.browser_version
          };
        }
      }),
      wait_time: 5,
      quality: 'compressed'
    };

    logger.info({
      message: 'BrowserStack API request payload',
      payload
    });

    const response = await fetch('https://api.browserstack.com/screenshots', {
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
      result = JSON.parse(responseText);
    } catch (error) {
      logger.error({
        message: 'Failed to parse BrowserStack API response',
        error: error.message,
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
      error: error?.message || String(error),
      stack: error?.stack,
      url
    });
    throw error;
  }
}