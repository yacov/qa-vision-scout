import { logger } from './utils/logger.ts'

interface BrowserConfig {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

export async function generateScreenshots(url: string, configs: BrowserConfig[]) {
  const username = Deno.env.get('BROWSERSTACK_USERNAME')
  const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY')

  if (!username || !accessKey) {
    logger.error({
      message: 'BrowserStack credentials missing',
      username: !!username,
      accessKey: !!accessKey
    })
    throw new Error('BrowserStack credentials not configured')
  }

  logger.info({
    message: 'Generating screenshots',
    url,
    configCount: configs.length
  })

  try {
    const auth = btoa(`${username}:${accessKey}`)
    const response = await fetch('https://api.browserstack.com/screenshots/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        browsers: configs.map(config => ({
          os: config.os,
          os_version: config.os_version,
          browser: config.browser,
          browser_version: config.browser_version,
          device: config.device
        })),
        wait_time: 5,
        quality: 'compressed'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({
        message: 'BrowserStack API error',
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url
      })
      throw new Error(`BrowserStack API error: ${response.statusText || errorText}`)
    }

    const result = await response.json()
    
    logger.info({
      message: 'Screenshot generation successful',
      jobId: result.job_id,
      url: url
    })

    return result
  } catch (error) {
    logger.error({
      message: 'Screenshot generation failed',
      error: error.message,
      stack: error.stack,
      url: url
    })
    throw error
  }
}