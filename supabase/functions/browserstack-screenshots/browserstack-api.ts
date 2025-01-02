import { logger } from './utils/logger.ts'

interface BrowserstackCredentials {
  username: string;
  accessKey: string;
}

interface BrowserConfig {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

export async function generateScreenshots(
  testId: string,
  url: string,
  selectedConfigs: BrowserConfig[]
) {
  const username = Deno.env.get('BROWSERSTACK_USERNAME');
  const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

  if (!username || !accessKey) {
    throw new Error('Missing BrowserStack credentials');
  }

  const credentials: BrowserstackCredentials = { username, accessKey };

  logger.info({
    message: 'Starting screenshot generation',
    testId,
    url,
    configCount: selectedConfigs.length
  });

  try {
    const auth = btoa(`${credentials.username}:${credentials.accessKey}`);
    const response = await fetch('https://api.browserstack.com/screenshots/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        browsers: selectedConfigs,
        wait_time: 5,
        quality: 'compressed'
      })
    });

    if (!response.ok) {
      throw new Error(`BrowserStack API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    logger.info({
      message: 'Screenshot generation successful',
      testId,
      jobId: result.job_id
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'Screenshot generation failed',
      testId,
      error: error.message
    });
    throw error;
  }
}