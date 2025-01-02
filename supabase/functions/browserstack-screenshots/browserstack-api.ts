import { v4 as uuidv4 } from "https://deno.land/std@0.208.0/uuid/mod.ts";
import { logger } from "./logger.ts";
import { handleBrowserstackResponse, validateResolution, validateWaitTime } from "./utils/api-utils.ts";
import { BrowserstackError } from "./errors/browserstack-error.ts";
import type { 
  BrowserstackCredentials, 
  ScreenshotRequest, 
  ScreenshotResponse,
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
      
      // Special handling for rate limit errors
      if (response.status === 429) {
        throw new BrowserstackError(
          'Rate limit exceeded',
          response.status,
          requestId,
          { errorText }
        );
      }
      
      throw new BrowserstackError(
        `Browserstack API error: ${response.statusText}`,
        response.status,
        requestId,
        { errorText }
      );
    }

    const responseText = await response.text();
    logger.info({
      message: 'Received response from Browserstack API',
      requestId,
      responseText
    });

    let data: Browser[];
    try {
      data = JSON.parse(responseText);
      
      // Validate that the response is an array and each item has required browser properties
      if (!Array.isArray(data)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each browser object has required properties
      data.forEach((browser, index) => {
        if (!browser.os || !browser.os_version) {
          throw new Error(`Browser at index ${index} is missing required properties`);
        }
      });
      
    } catch (error) {
      logger.error({
        message: 'Failed to parse Browserstack API response',
        requestId,
        error,
        responseText
      });
      throw new BrowserstackError(
        'Invalid JSON response from Browserstack API',
        500,
        requestId,
        { responseText }
      );
    }

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

  if (request.wait_time) {
    validateWaitTime(request.wait_time);
  }

  // Validate resolutions
  validateResolution(request.win_res, 'Windows');
  validateResolution(request.mac_res, 'Mac');

  // First, get available browsers
  let availableBrowsers: Browser[];
  try {
    availableBrowsers = await getBrowsers(credentials, requestId);
    
    if (!availableBrowsers || !Array.isArray(availableBrowsers) || availableBrowsers.length === 0) {
      logger.error({
        message: 'No browsers available from BrowserStack',
        requestId
      });
      throw new BrowserstackError(
        'No browsers available from BrowserStack',
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
    logger.debug({
      message: 'Processing browser configuration',
      requestId,
      browser
    });

    if (!browser.os) {
      throw new BrowserstackError(
        `Invalid browser configuration: OS is a required field`,
        400,
        requestId
      );
    }

    const matchingBrowser = availableBrowsers.find(b => {
      // Match OS and OS version first
      const osMatch = b.os && browser.os &&
        b.os.toLowerCase() === browser.os.toLowerCase() &&
        b.os_version === browser.os_version;

      if (!osMatch) return false;

      // For mobile devices, match by device name
      if (browser.device) {
        return b.device === browser.device;
      }

      // For desktop browsers, match by browser name
      if (browser.browser) {
        return b.browser && b.browser.toLowerCase() === browser.browser.toLowerCase();
      }

      return false;
    });

    if (!matchingBrowser) {
      const deviceInfo = browser.device ? ` (${browser.device})` : '';
      const browserInfo = browser.browser ? ` ${browser.browser}` : '';
      throw new BrowserstackError(
        `No matching browser configuration found for${browserInfo} on ${browser.os} ${browser.os_version || 'latest'}${deviceInfo}`,
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
    orientation: request.orientation || 'portrait',
    mac_res: request.mac_res || '1024x768',
    win_res: request.win_res || '1024x768',
    local: request.local || false
  };

  logger.info({
    message: 'Sending request to BrowserStack API',
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

  const result = await handleBrowserstackResponse<ScreenshotResponse>(response, requestId);

  // Start polling for completion if no callback URL is provided
  if (!request.callback_url) {
    logger.info({
      message: 'Starting to poll for screenshot completion',
      requestId,
      jobId: result.id
    });

    // Poll every 10 seconds for up to 5 minutes
    const maxPolls = 30;
    const pollInterval = 10000;
    let pollCount = 0;
    
    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`https://www.browserstack.com/screenshots/${result.id}.json`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      const status = await handleBrowserstackResponse<ScreenshotResponse>(statusResponse, requestId);

      if (status.state === 'done') {
        logger.info({
          message: 'Screenshots generated successfully',
          requestId,
          jobId: result.id
        });
        return status;
      }

      if (status.state === 'error') {
        logger.error({
          message: 'Screenshot generation failed',
          requestId,
          jobId: result.id,
          status
        });
        throw new BrowserstackError(
          'Screenshot generation failed',
          500,
          requestId,
          { status }
        );
      }

      pollCount++;
    }

    logger.error({
      message: 'Screenshot generation timed out',
      requestId,
      jobId: result.id
    });
    throw new BrowserstackError(
      'Screenshot generation timed out after 5 minutes',
      504,
      requestId
    );
  }

  return result;
}