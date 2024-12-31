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

  const data = await handleBrowserstackResponse<BrowsersResponse>(response, requestId);
  return data.browsers;
}

export async function generateScreenshots(
  request: ScreenshotRequest,
  credentials?: BrowserstackCredentials
): Promise<ScreenshotResponse> {
  const requestId = uuidv4();
  validateResolution(request.resolution, requestId);
  
  if (request.wait_time) {
    validateWaitTime(request.wait_time, requestId);
  }

  // First, get available browsers
  const availableBrowsers = await getBrowsers(credentials);
  
  const resolution = getResolutionForType(request.resolution);
  
  // Map browsers and handle versions
  const browsers = request.browsers.map(browser => {
    if (!browser.os || !browser.browser) {
      throw new BrowserstackError(
        `Invalid browser configuration: OS and browser are required fields`,
        400,
        requestId
      );
    }

    // For Chrome, find a supported version
    if (browser.browser.toLowerCase() === 'chrome') {
      const chromeVersions = availableBrowsers
        .filter(b => b.browser && 
                    b.browser.toLowerCase() === 'chrome' && 
                    b.os && 
                    b.os.toLowerCase() === browser.os.toLowerCase())
        .map(b => b.browser_version)
        .filter(v => v && v !== 'latest');

      if (chromeVersions.length === 0) {
        throw new BrowserstackError(
          `No matching browser configuration found for ${browser.os} ${browser.os_version}`,
          400,
          requestId
        );
      }

      return {
        ...browser,
        browser_version: chromeVersions[0]
      };
    }

    // For other browsers, validate against available browsers
    if (!availableBrowsers || !Array.isArray(availableBrowsers)) {
      throw new BrowserstackError(
        'Failed to fetch available browsers from Browserstack',
        500,
        requestId
      );
    }

    const matchingBrowser = availableBrowsers.find(b => 
      b.browser && browser.browser &&
      b.browser.toLowerCase() === browser.browser.toLowerCase() &&
      b.os && browser.os &&
      b.os.toLowerCase() === browser.os.toLowerCase() &&
      b.os_version === browser.os_version
    );

    if (!matchingBrowser) {
      throw new BrowserstackError(
        `No matching browser configuration found for ${browser.browser} on ${browser.os} ${browser.os_version || 'latest'}`,
        400,
        requestId
      );
    }

    return {
      ...browser,
      browser_version: browser.browser_version === 'latest' ? matchingBrowser.browser_version : browser.browser_version
    };
  });

  const payload = {
    url: request.url,
    browsers,
    quality: request.quality || 'compressed',
    wait_time: request.wait_time || 5,
    callback_url: request.callback_url,
    ...(request.resolution === 'WINDOWS' ? { win_res: resolution } : { mac_res: resolution })
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  const auth = credentials ? 
    btoa(`${credentials.username}:${credentials.password}`) :
    '';

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