// BrowserStack API interactions
export const getAvailableBrowsers = async (authHeader: HeadersInit): Promise<any[]> => {
  console.log('Fetching available browsers from BrowserStack...');
  const response = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
    headers: authHeader
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch browsers:', error);
    throw new Error(`Failed to fetch browsers: ${error}`);
  }
  
  const browsers = await response.json();
  console.log('Available BrowserStack configurations:', JSON.stringify(browsers, null, 2));
  
  return browsers.map((b: any) => ({
    os: b.os?.toLowerCase(),
    os_version: b.os_version,
    browser: b.browser?.toLowerCase(),
    browser_version: b.browser_version,
    device: b.device
  }));
};

export const generateScreenshots = async (settings: any, authHeader: HeadersInit): Promise<any> => {
  console.log('Generating screenshots with settings:', JSON.stringify(settings, null, 2));

  // Transform browser configurations to match BrowserStack API format
  const browsers = settings.browsers.map((browser: any) => {
    const config: any = {
      os: browser.os,
      os_version: browser.os_version
    };

    if (browser.device) {
      config.device = browser.device;
    } else {
      config.browser = browser.browser;
      config.browser_version = browser.browser_version?.toLowerCase() === 'latest' ? 'Latest' : browser.browser_version;
    }

    return config;
  });

  // Prepare request body according to BrowserStack API format
  const requestBody = {
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

  const response = await fetch('https://www.browserstack.com/screenshots', {
    method: 'POST',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Screenshot generation failed:', error);
    throw new Error(`Failed to generate screenshots: ${error}`);
  }

  const result = await response.json();
  console.log('Screenshot generation successful:', JSON.stringify(result, null, 2));
  return result;
};