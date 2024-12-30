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
  
  const osMatches = availableBrowsers.filter(b => 
    b.os?.toLowerCase() === normalizedConfig.os &&
    b.os_version === normalizedConfig.os_version
  );

  if (osMatches.length === 0) {
    console.log(`No matching OS found for ${normalizedConfig.os} ${normalizedConfig.os_version}`);
    return false;
  }

  if (config.device) {
    const isValid = osMatches.some(b => b.device === normalizedConfig.device);
    console.log(`Mobile device validation result for ${normalizedConfig.device}:`, isValid);
    return isValid;
  }

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

  if (!normalizedConfig.browser_version || 
      normalizedConfig.browser_version === 'latest' || 
      normalizedConfig.browser_version === 'Latest') {
    const versions = browserMatches
      .map(b => b.browser_version)
      .filter(v => v)
      .sort((a, b) => {
        const [aMajor = 0, aMinor = 0] = a!.split('.').map(Number);
        const [bMajor = 0, bMinor = 0] = b!.split('.').map(Number);
        return bMajor - aMajor || bMinor - aMinor;
      });
    
    console.log(`Using latest version (${versions[0]}) for ${normalizedConfig.browser}`);
    return versions.length > 0;
  }

  const hasVersion = browserMatches.some(b => {
    const availableVersion = b.browser_version?.toLowerCase();
    return availableVersion === normalizedConfig.browser_version ||
           availableVersion?.startsWith(normalizedConfig.browser_version!);
  });

  console.log(`Version validation result for ${normalizedConfig.browser_version}:`, hasVersion);
  return hasVersion;
};