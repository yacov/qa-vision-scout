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

// Helper function to format error messages
function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    try {
      const errorStr = JSON.stringify(error);
      return errorStr === '{}' ? 'Unknown error' : errorStr;
    } catch {
      return 'Unknown error';
    }
  }
  return String(error);
}

// Helper function to format error object for logging
function formatErrorForLog(error: unknown): { message: string; type?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.name
    };
  }
  return {
    message: formatErrorMessage(error),
    type: 'UnknownError'
  };
}

interface RetryOptions {
  requestId: string;
  maxRetries?: number;
  initialDelayMs?: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  { requestId, maxRetries = 3, initialDelayMs = 1000 }: RetryOptions
): Promise<T> {
  let retryCount = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      logger.warn('Operation failed', {
        requestId,
        retryCount,
        maxRetries,
        error: formatError(error),
      });

      if (retryCount >= maxRetries) {
        logger.error('Max retries exceeded', {
          requestId,
          retryCount,
          maxRetries,
          error: formatError(error),
        });
        throw error;
      }

      const delayMs = initialDelayMs * Math.pow(2, retryCount);
      logger.info('Retrying operation', {
        requestId,
        attempt: retryCount + 1,
        maxRetries,
        delayMs,
      });

      await new Promise(resolve => setTimeout(resolve, delayMs));
      retryCount++;
    }
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
        const errorText = await response.text();
        logger.error('Failed to fetch browsers', {
          requestId,
          status: response.status,
          statusText: response.statusText,
          error: { message: errorText }
        });

        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error('Invalid request parameters.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to fetch browsers: ${errorText}`);
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
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, { requestId, maxRetries: MAX_RETRIES, initialDelayMs: INITIAL_RETRY_DELAY });
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
        const errorText = await response.text();
        logger.error('Failed to check job status', {
          requestId,
          jobId,
          attempt: attempts,
          status: response.status,
          error: { message: errorText }
        });

        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error('Invalid job ID.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to check job status: ${errorText}`);
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
          errorMessage: status.message instanceof Error ? status.message.message : status.message
        });
        throw new Error('Screenshot generation failed: ' + status.message);
      }
    } catch (error) {
      logger.warn('Polling attempt failed', {
        requestId,
        jobId,
        attempt: attempts,
        error: formatErrorForLog(error)
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

export async function generateScreenshots(
  url: string,
  browsers: Browser[],
  options: Partial<ScreenshotOptions> = {},
  requestId: string,
): Promise<ScreenshotResult[]> {
  try {
    logger.info('Generating screenshots', {
      requestId,
      url,
      browserCount: browsers.length,
      settings: { url, browsers, ...options },
    });

    if (!url) {
      logger.warn('Missing URL parameter', { requestId });
      throw new Error('Missing required parameter: url');
    }

    if (!Array.isArray(browsers) || browsers.length === 0) {
      logger.warn('Missing or invalid browsers array', { requestId });
      throw new Error('Missing required parameter: browsers must be a non-empty array');
    }

    const processedBrowsers = browsers.map((browser, index) => {
      logger.info('Processing browser configuration', {
        requestId,
        index,
        browser,
      });
      return validateBrowserConfig(browser);
    });

    const requestBody = {
      url,
      browsers: processedBrowsers,
      quality: options.quality || 'compressed',
      wait_time: options.waitTime || 5,
    };

    logger.info('Sending request to BrowserStack API', {
      requestId,
      url,
      browserCount: browsers.length,
      requestBody,
    });

    const response = await fetch(`${BROWSERSTACK_API_BASE_URL}/screenshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      handleApiError(response, requestId);
    }

    const result = await response.json();
    return result.screenshots;
  } catch (error) {
    logger.error('Error in generateScreenshots', {
      requestId,
      error,
    });
    throw error;
  }
}

// Helper function to transform browser configuration
export function transformConfig(config: BrowserConfig) {
  const { device_type, ...rest } = config;
  return rest;
}

// Helper function to normalize OS configuration
export function normalizeOsConfig(config: { os: string; os_version: string }) {
  const normalizedConfig = { ...config };
  if (normalizedConfig.os.toLowerCase() === 'windows') {
    normalizedConfig.os = 'Windows';
  } else if (normalizedConfig.os.toLowerCase() === 'osx') {
    normalizedConfig.os = 'OS X';
  }
  return normalizedConfig;
}

interface BrowserstackError {
  message: string;
  type: string;
  status?: number;
  details?: unknown;
}

function formatError(error: unknown): BrowserstackError {
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.constructor.name,
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const { message, type, status, ...details } = error as Record<string, unknown>;
    return {
      message: String(message || 'Unknown error'),
      type: String(type || 'Error'),
      status: typeof status === 'number' ? status : undefined,
      details: Object.keys(details).length > 0 ? details : undefined,
    };
  }

  return {
    message: String(error),
    type: 'Error',
  };
}

function handleApiError(error: unknown, requestId: string): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = error instanceof Error ? error.constructor.name : 'Error';
  const errorDetails = error instanceof Error ? error.stack : undefined;

  logger.error('Screenshot generation request failed', {
    requestId,
    status: error instanceof Response ? error.status : undefined,
    error: {
      message: errorMessage,
      type: errorType,
      details: errorDetails,
    },
  });

  throw new Error(errorMessage);
}

const BROWSERSTACK_API_BASE_URL = 'https://www.browserstack.com';
const BROWSERSTACK_USERNAME = typeof Deno !== 'undefined' ? Deno.env.get('BROWSERSTACK_USERNAME') : process.env.BROWSERSTACK_USERNAME || '';
const BROWSERSTACK_ACCESS_KEY = typeof Deno !== 'undefined' ? Deno.env.get('BROWSERSTACK_ACCESS_KEY') : process.env.BROWSERSTACK_ACCESS_KEY || '';

interface Browser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface ScreenshotOptions {
  quality: 'compressed' | 'original';
  waitTime: number;
  orientation?: 'portrait' | 'landscape';
}

interface ScreenshotResult {
  id: string;
  url: string;
  thumb_url: string;
  browser: Browser;
  state: string;
  created_at: string;
}

function validateBrowserConfig(browser: Browser): Browser {
  const config: Browser = {
    os: browser.os.toLowerCase() === 'ios' ? 'ios' : browser.os.charAt(0).toUpperCase() + browser.os.slice(1).toLowerCase(),
    os_version: browser.os_version,
  };

  if (browser.device) {
    config.device = browser.device;
  } else {
    if (!browser.browser || !browser.browser_version) {
      throw new Error('Missing required parameters: browser and browser_version are required for desktop configurations');
    }
    config.browser = browser.browser.toLowerCase();
    config.browser_version = browser.browser_version.toLowerCase() === 'latest' ? 'latest' : browser.browser_version;
  }

  return config;
}