// BrowserStack API interactions

// Rate limiting constants
const MAX_REQUESTS_PER_WINDOW = 1600;
const WINDOW_SIZE_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Add supported iOS versions
const SUPPORTED_IOS_VERSIONS = ['12', '13', '14', '15', '16', '17'] as const;
type iOSVersion = typeof SUPPORTED_IOS_VERSIONS[number];

// Add supported iOS devices
const SUPPORTED_IOS_DEVICES = {
  'iPhone 15': '17',
  'iPhone 14': '16',
  'iPhone 13': '15',
  'iPhone 12': '14',
  'iPhone 11': '13',
  'iPhone X': '11'
} as const;

type iOSDevice = keyof typeof SUPPORTED_IOS_DEVICES;

function validateIOSDevice(device: string, version: string): void {
  const supportedVersion = SUPPORTED_IOS_DEVICES[device as iOSDevice];
  if (!supportedVersion) {
    throw new Error(
      `Invalid iOS device: ${device}. Valid devices are: ${Object.keys(SUPPORTED_IOS_DEVICES).join(', ')}`
    );
  }
  if (!SUPPORTED_IOS_VERSIONS.includes(version as iOSVersion)) {
    throw new Error(
      `Invalid iOS version: ${version}. Valid versions are: ${SUPPORTED_IOS_VERSIONS.join(', ')}`
    );
  }
  const minVersion = parseInt(supportedVersion);
  const requestedVersion = parseInt(version);
  if (requestedVersion > minVersion) {
    throw new Error(
      `Invalid iOS version for ${device}. Maximum supported version: ${supportedVersion}, got: ${version}`
    );
  }
}

class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor() {
    this.tokens = MAX_REQUESTS_PER_WINDOW;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= WINDOW_SIZE_MS) {
      this.tokens = MAX_REQUESTS_PER_WINDOW;
      this.lastRefill = now;
    }
  }

  async acquireToken(): Promise<void> {
    this.refillTokens();
    
    if (this.tokens <= 0) {
      const waitTime = WINDOW_SIZE_MS - (Date.now() - this.lastRefill);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`);
    }
    
    this.tokens--;
  }
}

const rateLimiter = new RateLimiter();

// Resolution constants as per API documentation
const VALID_WIN_RESOLUTIONS = [
  '1024x768',
  '1280x800',
  '1280x1024',
  '1366x768',
  '1440x900',
  '1680x1050',
  '1600x1200',
  '1920x1200',
  '1920x1080',
  '2048x1536'
] as const;

const VALID_MAC_RESOLUTIONS = [
  '1024x768',
  '1280x960',
  '1280x1024',
  '1600x1200',
  '1920x1080'
] as const;

const VALID_WAIT_TIMES = [2, 5, 10, 15, 20, 60] as const;

type WinResolution = typeof VALID_WIN_RESOLUTIONS[number];
type MacResolution = typeof VALID_MAC_RESOLUTIONS[number];
type WaitTime = typeof VALID_WAIT_TIMES[number];

interface BrowserConfig {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface ScreenshotSettings {
  url: string;
  browsers: BrowserConfig[];
  quality?: 'original' | 'compressed';
  wait_time?: WaitTime;
  win_res?: WinResolution;
  mac_res?: MacResolution;
  orientation?: 'portrait' | 'landscape';
}

interface BrowserStackResponse {
  job_id: string;
  callback_url?: string;
  win_res?: string;
  mac_res?: string;
  quality: string;
  wait_time: number;
  orientation: string;
  screenshots: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
    id: string;
    state: 'pending' | 'done' | 'error';
    url: string;
    thumb_url?: string;
    image_url?: string;
    created_at?: string;
  }>;
}

interface BrowserStackRequestBody {
  url: string;
  browsers: BrowserConfig[];
  quality: string;
  wait_time: number;
  win_res?: string;
  mac_res?: string;
  orientation?: string;
}

interface JobStatus {
  state: 'pending' | 'done' | 'error';
  screenshots: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
    id: string;
    state: 'pending' | 'done' | 'error';
    url: string;
    thumb_url?: string;
    image_url?: string;
    created_at?: string;
  }>;
}

function validateResolution(res: string | undefined, validResolutions: readonly string[], type: 'Windows' | 'Mac'): void {
  if (res && !validResolutions.includes(res)) {
    throw new Error(
      `Invalid ${type} resolution: ${res}. Valid resolutions are: ${validResolutions.join(', ')}`
    );
  }
}

function validateWaitTime(waitTime: number | undefined): void {
  if (waitTime && !VALID_WAIT_TIMES.includes(waitTime as WaitTime)) {
    throw new Error(
      `Invalid wait time: ${waitTime}. Valid wait times are: ${VALID_WAIT_TIMES.join(', ')} seconds`
    );
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Don't retry on authentication or validation errors
    if (error.message.includes('Authentication failed') || 
        error.message.includes('Invalid request parameters') ||
        error.message.includes('Rate limit exceeded')) {
      throw error;
    }

    if (retryCount >= MAX_RETRIES) {
      console.error(`Failed after ${MAX_RETRIES} retries:`, error);
      throw error;
    }

    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return withRetry(operation, retryCount + 1);
  }
}

function validateIOSVersion(version: string): void {
  if (!SUPPORTED_IOS_VERSIONS.includes(version as iOSVersion)) {
    throw new Error(
      `Invalid iOS version: ${version}. Valid versions are: ${SUPPORTED_IOS_VERSIONS.join(', ')}`
    );
  }
}

export const getAvailableBrowsers = async (authHeader: HeadersInit): Promise<BrowserConfig[]> => {
  return withRetry(async () => {
    await rateLimiter.acquireToken();
    
    console.log('Fetching available browsers from BrowserStack...');
    try {
      const response = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
        headers: authHeader
      });
      
      if (!response.ok) {
        const error = await response.text();
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error('Invalid request parameters.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        console.error('Failed to fetch browsers:', error);
        throw new Error(`Failed to fetch browsers: ${error}`);
      }
      
      const browsers = await response.json();
      console.log('Available BrowserStack configurations:', JSON.stringify(browsers, null, 2));
      
      return browsers.map((b: any) => ({
        os: b.os,  
        os_version: b.os_version,
        browser: b.browser?.toLowerCase(),
        browser_version: b.browser_version,
        device: b.device
      }));
    } catch (error) {
      console.error('Error in getAvailableBrowsers:', error);
      throw error;
    }
  });
};

async function pollJobStatus(jobId: string, authHeader: HeadersInit): Promise<JobStatus> {
  const POLLING_INTERVAL = 5000; // 5 seconds
  const MAX_ATTEMPTS = 20;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    try {
      await rateLimiter.acquireToken();
      
      const response = await fetch(`https://www.browserstack.com/screenshots/${jobId}.json`, {
        headers: authHeader
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error('Invalid job ID.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to check job status: ${error}`);
      }

      const status = await response.json();
      if (status.state === 'done') {
        console.log('Screenshots generation complete.');
        return status;
      } else if (status.state === 'error') {
        throw new Error('Screenshot generation failed: ' + status.message);
      }
    } catch (error) {
      console.warn(`Polling attempt ${attempts} failed:`, error);
      if (error instanceof Error && (
          error.message.includes('Authentication failed') || 
          error.message.includes('Invalid job ID') ||
          error.message.includes('Screenshot generation failed'))) {
        throw error;
      }
    }
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
  throw new Error('Job polling exceeded maximum attempts.');
}

export const generateScreenshots = async (settings: ScreenshotSettings, authHeader: HeadersInit): Promise<BrowserStackResponse> => {
  return withRetry(async () => {
    await rateLimiter.acquireToken();
    
    console.log('Generating screenshots with settings:', JSON.stringify(settings, null, 2));

    // Validate required fields
    if (!settings.url) {
      throw new Error('URL is required');
    }
    if (!Array.isArray(settings.browsers) || settings.browsers.length === 0) {
      throw new Error('At least one browser configuration is required');
    }

    // Validate resolutions and wait time
    validateResolution(settings.win_res, VALID_WIN_RESOLUTIONS, 'Windows');
    validateResolution(settings.mac_res, VALID_MAC_RESOLUTIONS, 'Mac');
    validateWaitTime(settings.wait_time);

    // Transform browser configurations to match BrowserStack API format
    const browsers = settings.browsers.map((browser: any) => {
      const config: any = {
        os: browser.os.toLowerCase() === 'ios' ? 'ios' : browser.os.charAt(0).toUpperCase() + browser.os.slice(1).toLowerCase(),
        os_version: browser.os_version
      };

      if (browser.device) {
        // Validate iOS device and version if the OS is iOS
        if (config.os === 'ios') {
          validateIOSDevice(browser.device, browser.os_version);
          config.os_version = browser.os_version.toString();
        }
        config.device = browser.device;
      } else {
        if (!browser.browser || !browser.browser_version) {
          throw new Error('Browser and browser version are required for desktop configurations');
        }
        config.browser = browser.browser;
        config.browser_version = browser.browser_version?.toLowerCase() === 'latest' ? 'Latest' : browser.browser_version;
      }

      return config;
    });

    // Prepare request body according to BrowserStack API format
    const requestBody: BrowserStackRequestBody = {
      url: settings.url,
      browsers,
      quality: settings.quality || 'compressed',
      wait_time: settings.wait_time || 5
    };

    // Only add optional parameters if they are needed
    if (settings.win_res) requestBody.win_res = settings.win_res;
    if (settings.mac_res) requestBody.mac_res = settings.mac_res;
    if (settings.orientation) requestBody.orientation = settings.orientation;

    console.log('Sending request to BrowserStack:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch('https://www.browserstack.com/screenshots', {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your BrowserStack credentials.');
        } else if (response.status === 422) {
          throw new Error(`Invalid request parameters: ${error}`);
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        console.error('Screenshot generation failed:', error);
        throw new Error(`Failed to generate screenshots: ${error}`);
      }

      const result = await response.json();
      console.log('Screenshot generation initiated:', JSON.stringify(result, null, 2));
      
      // Poll for job completion
      const finalResult = await pollJobStatus(result.job_id, authHeader);
      return {
        ...result,
        ...finalResult
      };
    } catch (error) {
      console.error('Error in generateScreenshots:', error);
      throw error;
    }
  });
};