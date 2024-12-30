interface BrowserConfig {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface AvailableBrowser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

// Browser configuration validation logic
export const validateBrowserConfig = (config: BrowserConfig, availableBrowsers: AvailableBrowser[]): boolean => {
  const normalizedConfig = {
    os: config.os?.toLowerCase(),
    os_version: config.os_version,
    browser: config.browser?.toLowerCase(),
    browser_version: config.browser_version?.toLowerCase(),
    device: config.device
  };

  console.log('Validating config:', JSON.stringify(normalizedConfig, null, 2));
  console.log('Available browsers:', JSON.stringify(availableBrowsers, null, 2));
  
  const osMatches = availableBrowsers.filter(b => 
    b.os?.toLowerCase() === normalizedConfig.os
  );

  if (osMatches.length === 0) {
    console.log(`No matching OS found for ${normalizedConfig.os}`);
    return false;
  }

  // For mobile devices
  if (config.device) {
    const isValid = osMatches.some(b => b.device === normalizedConfig.device);
    console.log(`Mobile device validation result for ${normalizedConfig.device}:`, isValid);
    return isValid;
  }

  // For desktop browsers
  if (!normalizedConfig.browser) {
    console.log('Missing browser information for desktop configuration');
    return false;
  }

  const browserMatches = osMatches.filter(b => 
    b.browser?.toLowerCase() === normalizedConfig.browser
  );

  if (browserMatches.length === 0) {
    console.log(`No matching browser found for ${normalizedConfig.browser}`);
    return false;
  }

  // Always accept 'latest' as a valid version
  if (!normalizedConfig.browser_version || 
      normalizedConfig.browser_version === 'latest') {
    console.log(`Accepting latest version for ${normalizedConfig.browser}`);
    return true;
  }

  // For specific versions, check if they exist
  const hasVersion = browserMatches.some(b => 
    b.browser_version === normalizedConfig.browser_version
  );

  console.log(`Version validation result for ${normalizedConfig.browser_version}:`, hasVersion);
  return hasVersion;
};