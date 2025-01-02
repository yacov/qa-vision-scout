import { logger } from "../logger";
import { BrowserstackError } from "../errors/browserstack-error";

export async function handleBrowserstackResponse<T>(response: Response, requestId: string): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Browserstack API error: ${response.status}`;
    
    // Special handling for rate limit errors
    if (response.status === 429) {
      errorMessage = 'Rate limit exceeded';
    }
    
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