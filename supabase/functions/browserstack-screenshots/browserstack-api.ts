import { logger } from './utils/logger.ts';
import { BrowserstackCredentials, ScreenshotInput } from './types.ts';

interface PollingOptions {
  maxPolls?: number;
  pollInterval?: number;
}

export async function generateScreenshots(input: ScreenshotInput, credentials: BrowserstackCredentials, options: PollingOptions = {}) {
  const { username, accessKey } = credentials;
  const { url, selected_configs, callback_url } = input;

  if (!username || !accessKey) {
    logger.error({
      message: 'BrowserStack credentials missing',
      username: !!username,
      accessKey: !!accessKey
    });
    throw new Error('BrowserStack credentials not configured');
  }

  logger.info({
    message: 'Generating screenshots',
    url: input.url,
    browserCount: selected_configs.length
  });

  try {
    const auth = btoa(`${username}:${accessKey}`);
    const response = await fetch('https://api.browserstack.com/screenshots', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        browsers: selected_configs.map(config => ({
          os: config.os,
          os_version: config.os_version,
          ...(config.browser && { browser: config.browser }),
          ...(config.browser_version && { browser_version: config.browser_version }),
          ...(config.device && { device: config.device })
        })),
        ...(callback_url && { callback_url })
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({
        message: 'BrowserStack API error',
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url
      });

      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }

      throw new Error(`BrowserStack API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // If no callback URL is provided, poll for completion
    if (!callback_url) {
      return await pollForCompletion(result.job_id, auth, options);
    }
    
    logger.info({
      message: 'Screenshot generation queued',
      jobId: result.job_id,
      url: url
    });

    return result;
  } catch (error: any) {
    logger.error({
      message: 'Screenshot generation failed',
      error: error?.message || String(error),
      stack: error?.stack,
      url: url
    });
    throw error;
  }
}

async function pollForCompletion(jobId: string, auth: string, options: PollingOptions = {}) {
  const { maxPolls = 30, pollInterval = 2000 } = options;
  let polls = 0;

  while (polls < maxPolls) {
    const response = await fetch(`https://api.browserstack.com/screenshots/${jobId}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to poll job status: ${response.statusText || errorText}`);
    }

    const result = await response.json();
    if (result.state === 'done') {
      return result;
    }

    polls++;
    if (polls < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Polling timeout exceeded');
}