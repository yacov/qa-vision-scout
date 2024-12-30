// BrowserStack API interactions
import { logger } from './logger';
import type {
  BrowserConfig,
  ScreenshotSettings,
  BrowserStackResponse,
  BrowserStackRequestBody,
  JobStatus
} from './types';
import {
  validateResolution,
  validateWaitTime,
  VALID_WIN_RESOLUTIONS,
  VALID_MAC_RESOLUTIONS
} from './types';

// Rate limiting constants
const MAX_REQUESTS_PER_WINDOW = 1600;
const WINDOW_SIZE_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Add supported iOS versions
const SUPPORTED_IOS_VERSIONS = ['12', '13', '14', '15', '16', '17'] as const;
type iOSVersion = typeof SUPPORTED_IOS_VERSIONS[number];

// Add supported iOS devices
const SUPPORTED_IOS_DEVICES = {
  'iPhone 15': '17',
  'iPhone 14': '16',
  'iPhone 13': '15',
  'iPhone 12': '14',
  'iPhone 11': '13',
  'iPhone X': '11'
} as const;

type iOSDevice = keyof typeof SUPPORTED_IOS_DEVICES;

function validateIOSDevice(device: string, version: string, requestId: string): void {
  logger.info('Validating iOS device configuration', {
    requestId,
    device,
    version,
    supportedDevices: Object.keys(SUPPORTED_IOS_DEVICES)
  });

  const supportedVersion = SUPPORTED_IOS_DEVICES[device as iOSDevice];
  if (!supportedVersion) {
    logger.warn('Invalid iOS device', {
      requestId,
      device,
      supportedDevices: Object.keys(SUPPORTED_IOS_DEVICES)
    });
    throw new Error(
      `Invalid iOS device: ${device}. Valid devices are: ${Object.keys(SUPPORTED_IOS_DEVICES).join(', ')}`
    );
  }
  if (!SUPPORTED_IOS_VERSIONS.includes(version as iOSVersion)) {
    logger.warn('Invalid iOS version', {
      requestId,
      version,
      supportedVersions: SUPPORTED_IOS_VERSIONS
    });
    throw new Error(
      `Invalid iOS version: ${version}. Valid versions are: ${SUPPORTED_IOS_VERSIONS.join(', ')}`
    );
  }
  const minVersion = parseInt(supportedVersion);
  const requestedVersion = parseInt(version);
  if (requestedVersion > minVersion) {
    logger.warn('iOS version not supported for device', {
      requestId,
      device,
      requestedVersion,
      maxSupportedVersion: supportedVersion
    });
    throw new Error(
      `Invalid iOS version for ${device}. Maximum supported version: ${supportedVersion}, got: ${version}`
    );
  }
}

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private requestId: string;

  constructor(requestId: string) {
    this.tokens = MAX_REQUESTS_PER_WINDOW;
    this.lastRefill = Date.now();
    this.requestId = requestId;
    logger.info('Initialized rate limiter', {
      requestId,
      maxRequests: MAX_REQUESTS_PER_WINDOW,
      windowSize: `${WINDOW_SIZE_MS/1000} seconds`
    });
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= WINDOW_SIZE_MS) {
      const oldTokens = this.tokens;
      this.tokens = MAX_REQUESTS_PER_WINDOW;
      this.lastRefill = now;
      logger.info('Refilled rate limit tokens', {
        requestId: this.requestId,
        previousTokens: oldTokens,
        newTokens: this.tokens,
        timePassed: `${timePassed/1000} seconds`
      });
    }
  }

  async acquireToken(): Promise<void> {
    this.refillTokens();
    
    if (this.tokens <= 0) {
      const waitTime = WINDOW_SIZE_MS - (Date.now() - this.lastRefill);
      logger.warn('Rate limit exceeded', {
        requestId: this.requestId,
        remainingTokens: this.tokens,
        waitTime: `${Math.ceil(waitTime / 1000)} seconds`,
        windowReset: new Date(this.lastRefill + WINDOW_SIZE_MS).toISOString()
      });
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
    }
    
    this.tokens--;
    logger.info('Acquired rate limit token', {
      requestId: this.requestId,
      remainingTokens: this.tokens,
      windowReset: new Date(this.lastRefill + WINDOW_SIZE_MS).toISOString()
    });
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  requestId: string,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    logger.warn('Operation failed', {
      requestId,
      retryCount,
      maxRetries: MAX_RETRIES,
      error: error.message
    });

    // Don't retry on authentication or validation errors
    if (error.message.includes('Authentication failed') || 
        error.message.includes('Invalid request parameters') ||
        error.message.includes('Rate limit exceeded')) {
      logger.info('Not retrying due to error type', {
        requestId,
        errorType: error.message.includes('Authentication failed') ? 'auth' :
                  error.message.includes('Invalid request parameters') ? 'validation' : 'rate_limit'
      });
      throw error;
    }

    if (retryCount >= MAX_RETRIES) {
      logger.error('Max retries exceeded', {
        requestId,
        retryCount,
        maxRetries: MAX_RETRIES,
        error
      });
      throw error;
    }

    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    logger.info('Retrying operation', {
      requestId,
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      delayMs: delay
    });
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return withRetry(operation, requestId, retryCount + 1);
  }
}

export const getAvailableBrowsers = async (authHeader: HeadersInit, requestId: string): Promise<BrowserConfig[]> => {
  return withRetry(async () => {
    const rateLimiter = new RateLimiter(requestId);
    await rateLimiter.acquireToken();
    
    logger.info('Fetching available browsers from BrowserStack', { requestId });
    try {
      const response = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
        headers: authHeader
      });
      
      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to fetch browsers', {
          requestId,
          status: response.status,
          statusText: response.statusText,
          error
        });

        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error('Invalid request parameters.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to fetch browsers: ${error}`);
      }
      
      const browsers = await response.json();
      logger.info('Successfully fetched browser configurations', {
        requestId,
        browserCount: browsers.length,
        browsers: browsers.map((b: any) => ({
          os: b.os,
          os_version: b.os_version,
          browser: b.browser?.toLowerCase(),
          device: b.device
        }))
      });
      
      return browsers.map((b: any) => ({
        os: b.os,
        os_version: b.os_version,
        browser: b.browser?.toLowerCase(),
        browser_version: b.browser_version,
        device: b.device
      }));
    } catch (error) {
      logger.error('Error in getAvailableBrowsers', {
        requestId,
        error
      });
      throw error;
    }
  }, requestId);
};

async function pollJobStatus(jobId: string, authHeader: HeadersInit, requestId: string): Promise<JobStatus> {
  const POLLING_INTERVAL = 5000; // 5 seconds
  const MAX_ATTEMPTS = 20;
  let attempts = 0;

  logger.info('Starting job status polling', {
    requestId,
    jobId,
    maxAttempts: MAX_ATTEMPTS,
    pollingInterval: `${POLLING_INTERVAL/1000} seconds`
  });

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    try {
      const rateLimiter = new RateLimiter(requestId);
      await rateLimiter.acquireToken();
      
      logger.info('Polling job status', {
        requestId,
        jobId,
        attempt: attempts,
        maxAttempts: MAX_ATTEMPTS
      });

      const response = await fetch(`https://www.browserstack.com/screenshots/${jobId}.json`, {
        headers: authHeader
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to check job status', {
          requestId,
          jobId,
          attempt: attempts,
          status: response.status,
          error
        });

        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error('Invalid job ID.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to check job status: ${error}`);
      }

      const status = await response.json();
      logger.info('Received job status', {
        requestId,
        jobId,
        attempt: attempts,
        state: status.state,
        screenshotCount: status.screenshots?.length
      });

      if (status.state === 'done') {
        logger.info('Screenshots generation complete', {
          requestId,
          jobId,
          attempts,
          screenshots: status.screenshots.map((s: any) => ({
            id: s.id,
            state: s.state,
            url: s.url
          }))
        });
        return status;
      } else if (status.state === 'error') {
        logger.error('Screenshot generation failed', {
          requestId,
          jobId,
          attempt: attempts,
          error: status.message
        });
        throw new Error('Screenshot generation failed: ' + status.message);
      }
    } catch (error) {
      logger.warn('Polling attempt failed', {
        requestId,
        jobId,
        attempt: attempts,
        error
      });
      if (error instanceof Error && (
          error.message.includes('Authentication failed') || 
          error.message.includes('Invalid job ID') ||
          error.message.includes('Screenshot generation failed'))) {
        throw error;
      }
    }
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
  logger.error('Job polling exceeded maximum attempts', {
    requestId,
    jobId,
    attempts,
    maxAttempts: MAX_ATTEMPTS
  });
  throw new Error('Job polling exceeded maximum attempts.');
}

export const generateScreenshots = async (settings: ScreenshotSettings, authHeader: HeadersInit, requestId: string): Promise<BrowserStackResponse> => {
  return withRetry(async () => {
    const rateLimiter = new RateLimiter(requestId);
    await rateLimiter.acquireToken();
    
    // Validate required parameters
    if (!settings.url) {
      logger.warn('Missing URL parameter', { requestId });
      throw new Error('Missing required parameter: url');
    }

    if (!settings.browsers || !Array.isArray(settings.browsers) || settings.browsers.length === 0) {
      logger.warn('Missing or invalid browsers array', { requestId });
      throw new Error('Missing required parameter: browsers must be a non-empty array');
    }

    logger.info('Generating screenshots', {
      requestId,
      url: settings.url,
      browserCount: settings.browsers.length,
      settings
    });

    // Validate resolutions and wait time
    validateResolution(settings.win_res, VALID_WIN_RESOLUTIONS, 'Windows', requestId);
    validateResolution(settings.mac_res, VALID_MAC_RESOLUTIONS, 'Mac', requestId);
    validateWaitTime(settings.wait_time, requestId);

    // Transform browser configurations
    const browsers = settings.browsers.map((browser: any, index: number) => {
      logger.info('Processing browser configuration', {
        requestId,
        index,
        browser
      });

      const config: any = {
        os: browser.os.toLowerCase() === 'ios' ? 'ios' : browser.os.charAt(0).toUpperCase() + browser.os.slice(1).toLowerCase(),
        os_version: browser.os_version
      };

      if (browser.device) {
        if (config.os === 'ios') {
          validateIOSDevice(browser.device, browser.os_version, requestId);
          config.os_version = browser.os_version.toString();
        }
        config.device = browser.device;
      } else {
        if (!browser.browser || !browser.browser_version) {
          logger.warn('Missing browser configuration', {
            requestId,
            index,
            hasBrowser: !!browser.browser,
            hasBrowserVersion: !!browser.browser_version
          });
          throw new Error('Missing required parameters: browser and browser_version are required for desktop configurations');
        }
        config.browser = browser.browser.toLowerCase();
        config.browser_version = typeof browser.browser_version === 'string' && 
                               browser.browser_version.toLowerCase() === 'latest' ? 
                               'latest' : browser.browser_version.toString();
      }

      return config;
    });

    const requestBody: BrowserStackRequestBody = {
      url: settings.url,
      browsers,
      quality: settings.quality || 'compressed',
      wait_time: settings.wait_time || 5
    };

    if (settings.win_res) requestBody.win_res = settings.win_res;
    if (settings.mac_res) requestBody.mac_res = settings.mac_res;
    if (settings.orientation) requestBody.orientation = settings.orientation;

    logger.info('Sending request to BrowserStack API', {
      requestId,
      url: settings.url,
      browserCount: browsers.length,
      requestBody
    });

    try {
      const response = await fetch('https://www.browserstack.com/screenshots', {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Screenshot generation request failed', {
          requestId,
          status: response.status,
          statusText: response.statusText,
          error
        });

        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error(`Invalid request parameters: ${error}`);
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to generate screenshots: ${error}`);
      }

      const result = await response.json();
      logger.info('Screenshot generation initiated', {
        requestId,
        jobId: result.job_id,
        screenshotCount: result.screenshots?.length
      });
      
      // Poll for job completion
      const finalResult = await pollJobStatus(result.job_id, authHeader, requestId);
      return {
        ...result,
        ...finalResult
      };
    } catch (error) {
      logger.error('Error in generateScreenshots', {
        requestId,
        error
      });
      throw error;
    }
  }, requestId);
};