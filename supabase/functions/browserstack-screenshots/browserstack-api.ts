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

  // Transform browser_version: 'latest' to 'Latest' as expected by BrowserStack API
  const browsers = settings.browsers.map((browser: any) => ({
    ...browser,
    browser_version: browser.browser_version?.toLowerCase() === 'latest' ? 'Latest' : browser.browser_version
  }));

  const response = await fetch('https://www.browserstack.com/screenshots', {
    method: 'POST',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...settings,
      browsers
    })
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