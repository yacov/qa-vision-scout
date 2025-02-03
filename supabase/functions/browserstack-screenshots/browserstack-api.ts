import { logger } from './utils/logger.ts';
import { BrowserstackError } from './errors/browserstack-error.ts';

interface BrowserConfig {
  device_type: 'mobile' | 'desktop';
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
  orientation?: string;
  win_res?: string;
  mac_res?: string;
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
    
    // Format browsers array according to BrowserStack API specs
    const browsers = selected_configs.map((config: BrowserConfig) => {
      const formattedBrowser: Record<string, any> = {
        os: config.os.toLowerCase(),
        os_version: config.os_version
      };

      if (config.device_type === 'mobile') {
        formattedBrowser.device = config.device;
      } else {
        formattedBrowser.browser = config.browser?.toLowerCase();
        formattedBrowser.browser_version = config.browser_version;
      }

      // Add resolution settings
      if (config.device_type === 'desktop') {
        if (config.os.toLowerCase() === 'windows' && config.win_res) {
          formattedBrowser.resolution = config.win_res;
        } else if (config.os.toLowerCase() === 'os x' && config.mac_res) {
          formattedBrowser.resolution = config.mac_res;
        }
      }

      // Add orientation for mobile devices
      if (config.device_type === 'mobile' && config.orientation) {
        formattedBrowser.orientation = config.orientation;
      }

      // Clean up undefined values
      Object.keys(formattedBrowser).forEach(key => {
        if (formattedBrowser[key] === undefined) {
          delete formattedBrowser[key];
        }
      });

      return formattedBrowser;
    });

    const payload = {
      url,
      browsers,
      wait_time: 5,
      quality: 'compressed'
    };

    logger.info({
      message: 'BrowserStack API request payload',
      payload: JSON.stringify(payload, null, 2)
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

    const responseText = await response.text();
    logger.info({
      message: 'BrowserStack API raw response',
      status: response.status,
      statusText: response.statusText,
      responseText
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