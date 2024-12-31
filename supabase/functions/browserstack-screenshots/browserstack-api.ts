import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";
import { logger } from "./logger.ts";
import { handleBrowserstackResponse, validateResolution, validateWaitTime } from "./utils/api-utils.ts";
import { BrowserstackError } from "./errors/browserstack-error.ts";
import type { 
  BrowserstackCredentials, 
  ScreenshotRequest, 
  ScreenshotResponse,
  BrowsersResponse,
  Browser 
} from "./types/api-types.ts";

export async function getBrowsers(
  credentials: BrowserstackCredentials,
  requestId: string
): Promise<Browser[]> {
  logger.info({
    message: 'Fetching available browsers',
    requestId
  });

  if (!credentials?.username || !credentials?.password) {
    throw new BrowserstackError(
      'Missing Browserstack credentials',
      400,
      requestId
    );
  }

  const auth = btoa(`${credentials.username}:${credentials.password}`);
  
  try {
    const response = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await handleBrowserstackResponse<BrowsersResponse>(response, requestId);
    
    if (!data?.browsers || !Array.isArray(data.browsers)) {
      throw new BrowserstackError(
        'Invalid response format from Browserstack API',
        500,
        requestId,
        { data }
      );
    }

    logger.info({
      message: 'Successfully fetched browsers',
      requestId,
      browserCount: data.browsers.length
    });

    return data.browsers;
  } catch (error) {
    logger.error({
      message: 'Failed to fetch browsers from Browserstack',
      requestId,
      error
    });
    throw error;
  }
}

export async function generateScreenshots(
  request: ScreenshotRequest,
  credentials: BrowserstackCredentials
): Promise<ScreenshotResponse> {
  const requestId = uuidv4();
  
  if (request.wait_time) {
    validateWaitTime(request.wait_time);
  }

  // First, get available browsers
  let availableBrowsers: Browser[];
  try {
    availableBrowsers = await getBrowsers(credentials, requestId);
    
    if (!availableBrowsers || !Array.isArray(availableBrowsers) || availableBrowsers.length === 0) {
      throw new BrowserstackError(
        'No browsers available from Browserstack',
        500,
        requestId
      );
    }
  } catch (error) {
    logger.error({
      message: 'Failed to get available browsers',
      requestId,
      error
    });
    throw error;
  }

  // Map browsers and handle versions
  const browsers = request.browsers.map(browser => {
    if (!browser.os || !browser.browser) {
      throw new BrowserstackError(
        `Invalid browser configuration: OS and browser are required fields`,
        400,
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
    callback_url: request.callback_url
  };

  logger.info({
    message: 'Generating screenshots',
    requestId,
    payload
  });

  const auth = btoa(`${credentials.username}:${credentials.password}`);
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