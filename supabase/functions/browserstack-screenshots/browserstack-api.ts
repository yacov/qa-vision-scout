import { logger } from "./utils/logger";
import { handleBrowserstackResponse } from "./utils/api-utils";
import { BrowserstackError } from "./utils/errors";
import type { 
  BrowserstackCredentials, 
  Browser,
  ScreenshotInput 
} from "./types/api-types";

const BROWSERSTACK_API_BASE = 'https://api.browserstack.com/screenshots/v1';
const DEFAULT_POLL_INTERVAL = 1000; // 1 second
const DEFAULT_MAX_POLL_ATTEMPTS = 30;

interface PollingOptions {
  pollInterval?: number;
  maxPolls?: number;
}

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

export async function getAvailableBrowsers(
  credentials: BrowserstackCredentials
): Promise<{ browsers: Browser[] }> {
  const requestId = crypto.randomUUID();
  logger.info({
    message: 'Fetching available browsers',
    requestId
  });

  if (!credentials?.username || !credentials?.accessKey) {
    throw new BrowserstackError(
      'Missing Browserstack credentials',
      400,
      requestId
    );
  }

  const auth = btoa(`${credentials.username}:${credentials.accessKey}`);
  
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

    handleBrowserstackResponse(response, requestId);
    const data = await response.json();
    
    logger.info({
      message: 'Successfully fetched browsers',
      requestId,
      browserCount: data.browsers.length
    });

    return { browsers: data.browsers };
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
  input: ScreenshotInput, 
  credentials: BrowserstackCredentials,
  options: PollingOptions = {}
) {
  const requestId = crypto.randomUUID();
  logger.info({
    message: 'Generating screenshots',
    requestId,
    input
  });

  // Validate browser configurations
  input.browsers.forEach(validateBrowserConfig);

  const response = await fetch(`${BROWSERSTACK_API_BASE}/screenshots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.accessKey}`)}`
    },
    body: JSON.stringify(input)
  });

  handleBrowserstackResponse(response, requestId);
  const data = await response.json();

  // Ensure both id and job_id are present for backward compatibility
  const result = {
    ...data,
    id: data.id || data.job_id,
    job_id: data.job_id || data.id
  };

  logger.info({
    message: 'Screenshot generation initiated',
    requestId,
    jobId: result.job_id,
    state: result.state
  });

  if (!input.callback_url) {
    return pollJobStatus(result.job_id, credentials, requestId, options);
  }

  return result;
}

export async function pollJobStatus(
  jobId: string, 
  credentials: BrowserstackCredentials, 
  requestId: string,
  options: PollingOptions = {}
) {
  const pollInterval = options.pollInterval || DEFAULT_POLL_INTERVAL;
  const maxPolls = options.maxPolls || DEFAULT_MAX_POLL_ATTEMPTS;
  let attempts = 0;

  while (attempts < maxPolls) {
    logger.info({
      message: 'Polling job status',
      requestId,
      jobId,
      attempt: attempts + 1,
      maxAttempts: maxPolls
    });

    const response = await fetch(`${BROWSERSTACK_API_BASE}/status/${jobId}`, {
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.accessKey}`)}`
      }
    });

    handleBrowserstackResponse(response, requestId);
    const data = await response.json();

    // Ensure both id and job_id are present for backward compatibility
    const result = {
      ...data,
      id: data.id || data.job_id,
      job_id: data.job_id || data.id
    };

    logger.info({
      message: 'Job status update',
      requestId,
      jobId,
      state: result.state,
      screenshotCount: result.screenshots?.length
    });

    if (result.state === 'done') {
      return result;
    }

    if (result.state === 'error') {
      throw new BrowserstackError('Screenshot generation failed', 500, requestId);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new BrowserstackError('Polling timeout exceeded', 408, requestId);
}