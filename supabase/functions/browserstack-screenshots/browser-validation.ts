// Browser configuration validation logic
export const validateBrowserConfig = (config: any, availableBrowsers: any[]): boolean => {
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

  // Handle 'latest' version specially
  if (!normalizedConfig.browser_version || 
      normalizedConfig.browser_version === 'latest') {
    console.log(`Using latest version for ${normalizedConfig.browser}`);
    return true; // Accept 'latest' as valid
  }

  const hasVersion = browserMatches.some(b => {
    const availableVersion = b.browser_version?.toLowerCase();
    return availableVersion === normalizedConfig.browser_version ||
           availableVersion?.startsWith(normalizedConfig.browser_version!);
  });

  console.log(`Version validation result for ${normalizedConfig.browser_version}:`, hasVersion);
  return hasVersion;
};