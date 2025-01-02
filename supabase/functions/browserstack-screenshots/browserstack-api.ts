import { v4 as uuidv4 } from "npm:uuid@9.0.0";
import { logger } from "./logger.ts";
import { handleBrowserstackResponse, validateResolution, validateWaitTime } from "./utils/api-utils.ts";
import { BrowserstackError } from "./errors/browserstack-error.ts";
import type { 
  BrowserstackCredentials, 
  ScreenshotRequest, 
  ScreenshotResponse,
  Browser 
} from "./types/api-types.ts";

const POLLING_INTERVAL = 1000; // 1 second
const POLLING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function formatBrowserVersion(version: string | undefined): string | undefined {
  if (!version) return undefined;
  
  // If version is 'latest', return as is
  if (version.toLowerCase() === 'latest') return 'latest';
  
  // Extract major version number
  const majorVersion = version.split('.')[0];
  if (!majorVersion) return undefined;
  
  // Return formatted version (major.0)
  return `${majorVersion}.0`;
}

function validateBrowserConfig(browser: Browser): void {
  if (browser.browser && !browser.browser_version) {
    throw new Error('Browser version is required when browser is specified');
  }

  if (browser.browser_version) {
    const formattedVersion = formatBrowserVersion(browser.browser_version);
    if (!formattedVersion) {
      throw new Error('Invalid browser version format. Use "latest" or major version number (e.g., "121")');
    }
    // Update the browser version to the formatted version
    browser.browser_version = formattedVersion;
  }
}

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
    logger.info({
      message: 'Making request to Browserstack API',
      requestId,
      url: 'https://www.browserstack.com/screenshots/browsers.json'
    });

    const response = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({
        message: 'Browserstack API returned error',
        requestId,
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      throw new BrowserstackError(
        `BrowserStack API error: ${response.statusText}`,
        response.status,
        requestId,
        { errorText }
      );
    }

    const data = await response.json();
    
    logger.info({
      message: 'Successfully fetched browsers',
      requestId,
      browserCount: data.length
    });

    return data;
  } catch (error) {
    logger.error({
      message: 'Failed to fetch browsers from Browserstack',
      requestId,
      error
    });
    throw error;
  }
}

async function pollJobStatus(
  jobId: string,
  credentials: BrowserstackCredentials,
  requestId: string
): Promise<ScreenshotResponse> {
  const auth = btoa(`${credentials.username}:${credentials.password}`);
  const startTime = Date.now();

  while (true) {
    const response = await fetch(`https://www.browserstack.com/screenshots/${jobId}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BrowserstackError(
        `Failed to poll job status: ${response.statusText}`,
        response.status,
        requestId,
        { errorText }
      );
    }

    const result = await response.json();
    if (result.state === 'done') {
      return result;
    }

    if (Date.now() - startTime > POLLING_TIMEOUT) {
      throw new BrowserstackError(
        'Polling timeout exceeded',
        408,
        requestId
      );
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
}

export async function generateScreenshots(
  request: ScreenshotRequest,
  credentials: BrowserstackCredentials
): Promise<ScreenshotResponse> {
  const requestId = uuidv4();
  
  logger.info({
    message: 'Starting screenshot generation',
    requestId,
    url: request.url,
    browserCount: request.browsers?.length
  });

  if (!credentials?.username || !credentials?.password) {
    logger.error({
      message: 'Missing BrowserStack credentials',
      requestId
    });
    throw new BrowserstackError(
      'Missing BrowserStack credentials',
      400,
      requestId
    );
  }

  // Validate and format browser configurations
  request.browsers.forEach(browser => {
    try {
      validateBrowserConfig(browser);
    } catch (error) {
      logger.error({
        message: 'Browser configuration validation failed',
        requestId,
        browser,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new BrowserstackError(
        error instanceof Error ? error.message : 'Invalid browser configuration',
        422,
        requestId
      );
    }
  });

  const auth = btoa(`${credentials.username}:${credentials.password}`);
  
  try {
    logger.debug({
      message: 'Processing browser configuration',
      requestId,
      browser: request.browsers?.[0]
    });

    const response = await fetch('https://www.browserstack.com/screenshots', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({
        message: 'BrowserStack API error response',
        requestId,
        status: response.status,
        errorText
      });

      throw new BrowserstackError(
        `BrowserStack API error: ${response.statusText}`,
        response.status,
        requestId,
        { errorText }
      );
    }

    const result = await response.json();
    if (!result.id) {
      throw new BrowserstackError(
        'Response missing required id field',
        500,
        requestId
      );
    }

    // If no callback URL is provided, poll for completion
    if (!request.callback_url) {
      return await pollJobStatus(result.id, credentials, requestId);
    }

    return result;
  } catch (error) {
    logger.error({
      message: 'Failed to generate screenshots',
      requestId,
      error
    });
    throw error;
  }
}