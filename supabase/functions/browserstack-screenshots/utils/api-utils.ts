import { logger } from "../logger.ts";
import { BrowserstackError } from "../errors/browserstack-error.ts";

export async function handleBrowserstackResponse<T>(response: Response, requestId: string): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Browserstack API error: ${response.status}`;
    let errorText = '';
    
    try {
      errorText = await response.text();
      logger.error({
        message: 'BrowserStack API error response',
        requestId,
        status: response.status,
        errorText
      });
    } catch (e) {
      logger.error({
        message: 'Failed to read error response',
        requestId,
        error: e
      });
    }
    
    // Special handling for rate limit errors
    if (response.status === 429) {
      errorMessage = 'Rate limit exceeded';
    }
    
    throw new BrowserstackError(errorMessage, response.status, requestId, {
      errorText,
      statusText: response.statusText
    });
  }

  try {
    const responseText = await response.text();
    logger.debug({
      message: 'Raw BrowserStack API response',
      requestId,
      responseText
    });

    // Check if response is empty
    if (!responseText) {
      throw new Error('Empty response from BrowserStack API');
    }

    try {
      const data = JSON.parse(responseText);
      
      // Basic validation of response structure
      if (data === null || data === undefined) {
        throw new Error('Null or undefined response data');
      }

      // For browsers.json endpoint, validate array structure
      if (Array.isArray(data)) {
        if (data.length === 0) {
          throw new Error('Empty browser list received');
        }
        // Validate each browser object has required properties
        data.forEach((browser, index) => {
          if (!browser.os || !browser.os_version) {
            throw new Error(`Browser at index ${index} is missing required properties`);
          }
        });
      }

      return data as T;
    } catch (parseError) {
      logger.error({
        message: 'Failed to parse BrowserStack API response',
        requestId,
        responseText,
        error: parseError
      });
      throw new BrowserstackError(
        'Invalid response format from Browserstack API',
        response.status,
        requestId,
        { responseText }
      );
    }
  } catch (error) {
    logger.error({
      message: 'Failed to handle BrowserStack API response',
      requestId,
      error
    });
    throw new BrowserstackError(
      error instanceof Error ? error.message : 'Unknown error processing response',
      response.status,
      requestId
    );
  }
}

export function validateResolution(resolution: string | undefined, type: 'Windows' | 'Mac'): void {
  if (!resolution) return;
  
  const validResolutions = type === 'Windows' 
    ? ['1024x768', '1280x1024', '1920x1080']
    : ['1024x768', '1280x960', '1280x1024', '1600x1200', '1920x1080'];
  
  if (!validResolutions.includes(resolution)) {
    throw new Error(
      `Invalid ${type} resolution: ${resolution}. Valid resolutions are: ${validResolutions.join(', ')}`
    );
  }
}

export function validateWaitTime(waitTime: number | undefined): void {
  if (!waitTime) return;
  
  const validWaitTimes = [2, 5, 10, 15, 20, 60];
  if (!validWaitTimes.includes(waitTime)) {
    throw new Error(
      `Invalid wait time: ${waitTime}. Valid wait times are: ${validWaitTimes.join(', ')} seconds`
    );
  }
}
