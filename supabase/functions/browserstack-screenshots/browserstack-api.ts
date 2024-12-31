import { v4 as uuidv4 } from 'uuid';
import { 
  VALID_RESOLUTIONS, 
  VALID_WAIT_TIMES, 
  type ResolutionType,
  getResolutionForType
} from './types';
import type { Response } from 'node-fetch';

export interface BrowserstackCredentials {
  username: string;
  password: string;
}

export interface Browser {
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
}

export interface ScreenshotRequest {
  url: string;
  resolution: ResolutionType;
  waitTime: typeof VALID_WAIT_TIMES[number];
  browsers: Browser[];
}

export interface Screenshot {
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  url: string;
  thumb_url: string;
  image_url: string;
}

export interface ScreenshotResponse {
  job_id: string;
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
  // First check if the resolution type is valid
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

async function handleBrowserstackResponse<T>(response: Response, requestId: string): Promise<T> {
  // Handle rate limiting first
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
    responseText = await response.text();
    if (responseText) {
      responseData = JSON.parse(responseText);
    }
  } catch (e) {
    // If we can't parse the response as JSON, throw an error with the raw text
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

  // Handle other errors
  if (!response.ok || !responseData) {
    const errorData = responseData as BrowserstackErrorResponse;
    const errorMessage = errorData?.message || 'Unknown error';
    throw new BrowserstackError(
      errorMessage,
      response.status,
      requestId,
      { responseData }
    );
  }

  return responseData as T;
}

export async function getBrowsers(credentials?: BrowserstackCredentials): Promise<Browser[]> {
  const requestId = uuidv4();
  const response = await fetch('https://api.browserstack.com/screenshots/browsers.json', {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${credentials?.username || ''}:${credentials?.password || ''}`).toString('base64')}`,
      'Content-Type': 'application/json'
    }
  }) as unknown as Response;

  return handleBrowserstackResponse<Browser[]>(response, requestId);
}

export async function generateScreenshots(
  request: ScreenshotRequest,
  credentials?: BrowserstackCredentials
): Promise<ScreenshotResponse> {
  const requestId = uuidv4();

  // Validate inputs before making API call
  validateResolution(request.resolution, requestId);
  validateWaitTime(request.waitTime, requestId);

  const resolution = getResolutionForType(request.resolution);
  const response = await fetch('https://api.browserstack.com/screenshots', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${credentials?.username || ''}:${credentials?.password || ''}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      url: request.url,
      resolution,
      wait_time: request.waitTime,
      browsers: request.browsers
    })
  }) as unknown as Response;

  return handleBrowserstackResponse<ScreenshotResponse>(response, requestId);
}