import { v4 as uuidv4 } from 'uuid';
import { 
  VALID_RESOLUTIONS, 
  VALID_WAIT_TIMES, 
  type ResolutionType,
  getResolutionForType
} from './types.js';

// Remove node-fetch import and use native Response type
type FetchResponse = globalThis.Response;

export interface BrowserstackCredentials {
  username: string;
  password: string;
}

export interface Browser {
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
  device?: string | null;
}

export interface BrowsersResponse {
  browsers: Browser[];
}

export interface ScreenshotRequest {
  url: string;
  resolution: ResolutionType;
  browsers: Browser[];
  wait_time?: typeof VALID_WAIT_TIMES[number];
  quality?: 'compressed' | 'original';
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
  browser: string;
  browser_version: string;
  created_at: string;
}

export interface ScreenshotResponse {
  job_id: string;
  state: string;
  callback_url: string | null;
  win_res?: string;
  mac_res?: string;
  quality: 'compressed' | 'original';
  wait_time: number;
  screenshots: Screenshot[];
}

export interface BrowserstackErrorResponse {
  message?: string;
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

function validateResolution(resolution: ResolutionType, requestId: string): void {
  if (!VALID_RESOLUTIONS[resolution]) {
    throw new BrowserstackError(
      `Invalid ${resolution} resolution`,
      400,
      requestId
    );
  }

  const resolutionValue = getResolutionForType(resolution);
  const validResolutions = VALID_RESOLUTIONS[resolution];
  
  if (!validResolutions.includes(resolutionValue as any)) {
    throw new BrowserstackError(
      `Invalid ${resolution} resolution: ${resolutionValue}. Must be one of: ${validResolutions.join(', ')}`,
      400,
      requestId
    );
  }
}

function validateWaitTime(waitTime: typeof VALID_WAIT_TIMES[number], requestId: string): void {
  if (!VALID_WAIT_TIMES.includes(waitTime)) {
    throw new BrowserstackError(
      `Invalid wait time: ${waitTime}. Must be one of: ${VALID_WAIT_TIMES.join(', ')}`,
      400,
      requestId
    );
  }
}

async function handleBrowserstackResponse<T>(response: FetchResponse, requestId: string): Promise<T> {
  if (response.status === 429) {
    throw new BrowserstackError(
      'Rate limit exceeded',
      response.status,
      requestId
    );
  }

  let responseData: unknown = null;
  let responseText = '';

  try {
    const clonedResponse = response.clone();
    responseText = await clonedResponse.text();
    if (responseText) {
      responseData = JSON.parse(responseText);
    }
  } catch (e) {
    throw new BrowserstackError(
      'Invalid response format',
      response.status,
      requestId,
      {
        responseText,
        error: e
      }
    );
  }

  if (!response.ok) {
    const errorData = responseData as BrowserstackErrorResponse;
    const errorMessage = errorData?.message || `HTTP Error ${response.status}`;
    throw new BrowserstackError(
      errorMessage,
      response.status,
      requestId,
      { responseData }
    );
  }

  if (!responseData) {
    throw new BrowserstackError(
      'Empty response',
      response.status,
      requestId
    );
  }

  return responseData as T;
}

export async function getBrowsers(credentials?: BrowserstackCredentials): Promise<Browser[]> {
  const requestId = uuidv4();
  const auth = credentials ? 
    Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64') :
    '';

  const response = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
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
    // For Chrome, find a supported version
    if (browser.browser?.toLowerCase() === 'chrome') {
      const chromeVersions = availableBrowsers
        .filter(b => b.browser?.toLowerCase() === 'chrome' && b.os?.toLowerCase() === browser.os?.toLowerCase())
        .map(b => b.browser_version)
        .filter(v => v && v !== 'latest');

      if (chromeVersions.length === 0) {
        throw new BrowserstackError(
          'No supported Chrome versions found',
          400,
          requestId
        );
      }

      // Use the first available version
      return {
        ...browser,
        browser_version: chromeVersions[0]
      };
    }

    // For other browsers, validate against available browsers
    const matchingBrowser = availableBrowsers.find(b => 
      b.browser?.toLowerCase() === browser.browser?.toLowerCase() &&
      b.os?.toLowerCase() === browser.os?.toLowerCase() &&
      b.os_version === browser.os_version
    );

    if (!matchingBrowser) {
      throw new BrowserstackError(
        `No matching browser configuration found for ${browser.browser} on ${browser.os} ${browser.os_version}`,
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
    Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64') :
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