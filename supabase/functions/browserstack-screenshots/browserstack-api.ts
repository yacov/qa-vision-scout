import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";
import { logger } from "./logger.ts";

export interface BrowserstackCredentials {
  username: string;
  password: string;
}

export interface Browser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

export interface ScreenshotRequest {
  url: string;
  browsers: Browser[];
  quality?: 'compressed' | 'original';
  wait_time?: number;
  callback_url?: string;
}

export interface Screenshot {
  id: string;
  url: string;
  thumb_url: string;
  image_url: string;
  state: string;
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  created_at: string;
}

export interface ScreenshotResponse {
  job_id: string;
  state: string;
  callback_url: string | null;
  quality: 'compressed' | 'original';
  wait_time: number;
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

async function handleBrowserstackResponse<T>(response: Response, requestId: string): Promise<T> {
  if (!response.ok) {
    const errorMessage = `Browserstack API error: ${response.status} ${response.statusText}`;
    logger.error({
      message: errorMessage,
      requestId,
      status: response.status,
      statusText: response.statusText
    });
    throw new BrowserstackError(errorMessage, response.status, requestId);
  }

  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    logger.error({
      message: 'Failed to parse Browserstack API response',
      requestId,
      error
    });
    throw new BrowserstackError('Invalid response format', response.status, requestId);
  }
}

export async function generateScreenshots(
  request: ScreenshotRequest,
  credentials: BrowserstackCredentials,
  requestId: string
): Promise<ScreenshotResponse> {
  logger.info({
    message: 'Generating screenshots',
    requestId,
    url: request.url,
    browserCount: request.browsers.length
  });

  const auth = btoa(`${credentials.username}:${credentials.password}`);

  // First, get available browsers
  const browsersResponse = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });

  const availableBrowsers = await handleBrowserstackResponse<{ browsers: Browser[] }>(
    browsersResponse,
    requestId
  );

  if (!availableBrowsers.browsers || !Array.isArray(availableBrowsers.browsers)) {
    logger.error({
      message: 'Invalid browsers response from Browserstack',
      requestId,
      response: availableBrowsers
    });
    throw new BrowserstackError('Invalid browsers response', 500, requestId);
  }

  const payload = {
    url: request.url,
    quality: request.quality || 'compressed',
    wait_time: request.wait_time || 5,
    callback_url: request.callback_url,
    browsers: request.browsers.map(browser => {
      const matchingBrowser = availableBrowsers.browsers.find(b => 
        b.os?.toLowerCase() === browser.os?.toLowerCase() &&
        b.os_version === browser.os_version &&
        (!browser.browser || b.browser?.toLowerCase() === browser.browser?.toLowerCase())
      );

      if (!matchingBrowser) {
        logger.error({
          message: 'No matching browser configuration found',
          requestId,
          browser
        });
        throw new BrowserstackError(
          `No matching browser configuration found for ${browser.os} ${browser.os_version}`,
          400,
          requestId
        );
      }

      return {
        ...browser,
        browser_version: browser.browser_version || matchingBrowser.browser_version
      };
    })
  };

  logger.info({
    message: 'Sending screenshot request to Browserstack',
    requestId,
    payload
  });

  const response = await fetch('https://www.browserstack.com/screenshots', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleBrowserstackResponse<ScreenshotResponse>(response, requestId);
}