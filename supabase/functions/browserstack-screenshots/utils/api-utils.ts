import { BrowserstackError } from './errors';

export function handleBrowserstackResponse(response: Response, requestId: string = 'unknown') {
  if (!response.ok) {
    const errorMessage = response.status === 429 
      ? 'Rate limit exceeded'
      : `BrowserStack API error: ${response.status}${
          response.statusText ? ` - ${response.statusText}` : ''
        }`;
    throw new BrowserstackError(errorMessage, response.status, requestId);
  }
  return response;
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