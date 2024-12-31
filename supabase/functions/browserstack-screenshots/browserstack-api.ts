import { z } from 'zod';
import { RateLimiter } from './rate-limiter';
import { logger } from './logger';

const BROWSERSTACK_API_BASE = 'https://api.browserstack.com/screenshots/v1';
const rateLimiter = new RateLimiter(5, 1000); // 5 requests per second

export interface BrowserstackCredentials {
  username: string;
  password: string;
}

export interface BrowserConfig {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string | null;
  device?: string | null;
  real_mobile?: boolean | null;
}

export interface BrowserList {
  desktop: BrowserConfig[];
  mobile: BrowserConfig[];
}

export interface ScreenshotOptions {
  quality?: 'compressed' | 'original';
  waitTime?: number;
  orientation?: 'portrait' | 'landscape';
  callbackUrl?: string;
  macResolution?: string;
  windowsResolution?: string;
  local?: boolean;
}

export interface Screenshot {
  url: string;
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string | null;
  device?: string | null;
}

export interface ScreenshotResult {
  job_id: string;
  screenshots: Screenshot[];
}

export class BrowserstackError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public requestId: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BrowserstackError';
  }
}

const browserConfigSchema = z.object({
  os: z.string(),
  os_version: z.string(),
  browser: z.string().optional(),
  browser_version: z.string().nullable().optional(),
  device: z.string().nullable().optional(),
  real_mobile: z.boolean().nullable().optional(),
});

const browserResponseSchema = z.array(browserConfigSchema);

const screenshotSchema = z.object({
  url: z.string(),
  os: z.string(),
  os_version: z.string(),
  browser: z.string().optional(),
  browser_version: z.string().nullable().optional(),
  device: z.string().nullable().optional(),
});

const screenshotResultSchema = z.object({
  job_id: z.string(),
  screenshots: z.array(screenshotSchema),
});

const submitResponseSchema = z.object({
  job_id: z.string(),
});

const jobStatusSchema = z.object({
  job_id: z.string(),
  state: z.enum(['queued', 'processing', 'done', 'error']),
  message: z.string().optional(),
  screenshots: z.array(screenshotSchema).optional(),
});

function getAuthorizationHeader(credentials: BrowserstackCredentials): string {
  const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
  return `Basic ${authString}`;
}

export async function getAvailableBrowsers(
  credentials: BrowserstackCredentials,
  requestId: string
): Promise<BrowserList> {
  try {
    if (!credentials.username || !credentials.password) {
      throw new BrowserstackError('Missing required credentials', 400, requestId);
    }

    await rateLimiter.acquireToken();

    const response = await fetch(`${BROWSERSTACK_API_BASE}/browsers.json`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthorizationHeader(credentials),
        'Accept': 'application/json',
        'User-Agent': 'BrowserStack-Integration-Tests',
      },
    });

    if (!response.ok) {
      throw new BrowserstackError(
        await response.text(),
        response.status,
        requestId,
        { response }
      );
    }

    const data = await response.json();
    const browsers = browserResponseSchema.parse(data);

    // Split browsers into desktop and mobile
    const desktop = browsers.filter(browser => !browser.real_mobile && !browser.device);
    const mobile = browsers.filter(browser => browser.real_mobile || browser.device);

    return { desktop, mobile };
  } catch (error) {
    const browserStackError = error instanceof BrowserstackError
      ? error
      : new BrowserstackError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          500,
          requestId,
          { originalError: error }
        );

    logger.error({
      message: 'Error fetching available browsers',
      error: browserStackError,
      requestId,
    });

    throw browserStackError;
  }
}

export async function generateScreenshots(
  url: string,
  browsers: BrowserConfig[],
  credentials: BrowserstackCredentials,
  options: ScreenshotOptions = {},
  requestId: string
): Promise<ScreenshotResult> {
  try {
    // Validate required parameters
    if (!url) {
      throw new BrowserstackError('Missing required parameter: url', 400, requestId);
    }
    if (!Array.isArray(browsers) || browsers.length === 0) {
      throw new BrowserstackError('Missing required parameter: browsers must be a non-empty array', 400, requestId);
    }
    if (!credentials.username || !credentials.password) {
      throw new BrowserstackError('Missing required credentials', 400, requestId);
    }

    await rateLimiter.acquireToken();

    // Step 1: Submit screenshot generation job
    const requestBody = {
      url,
      quality: options.quality || 'compressed',
      wait_time: options.waitTime || 5,
      orientation: options.orientation || 'portrait',
      callback_url: options.callbackUrl || 'https://example.com/callback',
      mac_res: options.macResolution || '1920x1080',
      win_res: options.windowsResolution || '1920x1080',
      local: options.local || false,
      browsers: browsers.map(browser => {
        const config: Record<string, string | boolean | null> = {
          os: browser.os,
          os_version: browser.os_version,
        };

        if (browser.device) {
          config.device = browser.device;
          config.realMobile = true;
        } else {
          config.browser = browser.browser!;
          config.browser_version = browser.browser_version || 'latest';
        }

        return config;
      }),
    };

    logger.info({
      message: 'Submitting screenshot generation request',
      requestBody,
      requestId,
    });

    const submitResponse = await fetch(`${BROWSERSTACK_API_BASE}`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthorizationHeader(credentials),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BrowserStack-Integration-Tests',
      },
      body: JSON.stringify(requestBody),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      logger.error({
        message: 'Screenshot generation request failed',
        error: errorText,
        status: submitResponse.status,
        requestId,
        responseText: errorText,
      });
      throw new BrowserstackError(
        errorText || 'Failed to submit screenshot generation job',
        submitResponse.status,
        requestId,
        { response: submitResponse, responseText: errorText }
      );
    }

    const submitData = submitResponseSchema.parse(await submitResponse.json());
    const jobId = submitData.job_id;

    // Step 2: Poll for job completion
    const maxAttempts = 30; // Maximum number of polling attempts
    const pollInterval = 2000; // Poll every 2 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      await rateLimiter.acquireToken();

      const statusResponse = await fetch(`${BROWSERSTACK_API_BASE}/${jobId}.json`, {
        method: 'GET',
        headers: {
          'Authorization': getAuthorizationHeader(credentials),
          'Accept': 'application/json',
          'User-Agent': 'BrowserStack-Integration-Tests',
        },
      });

      if (!statusResponse.ok) {
        throw new BrowserstackError(
          await statusResponse.text(),
          statusResponse.status,
          requestId,
          { response: statusResponse }
        );
      }

      const statusData = jobStatusSchema.parse(await statusResponse.json());
      
      if (statusData.state === 'done' && statusData.screenshots) {
        return {
          job_id: statusData.job_id,
          screenshots: statusData.screenshots,
        };
      } else if (statusData.state === 'error') {
        throw new BrowserstackError(
          statusData.message || 'Screenshot generation failed',
          500,
          requestId,
          { response: statusData }
        );
      }

      attempts++;
    }

    throw new BrowserstackError(
      'Screenshot generation timed out',
      500,
      requestId
    );
  } catch (error) {
    const browserStackError = error instanceof BrowserstackError
      ? error
      : new BrowserstackError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          500,
          requestId,
          { originalError: error }
        );

    logger.error({
      message: 'Error generating screenshots',
      error: browserStackError,
      requestId,
    });

    throw browserStackError;
  }
}