interface BrowserConfig {
  device_type: 'mobile' | 'desktop';
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

const VALID_WIN_RESOLUTIONS = ['1024x768', '1280x1024'];
const VALID_MAC_RESOLUTIONS = ['1024x768', '1280x960', '1280x1024', '1600x1200', '1920x1080'];
const VALID_ORIENTATIONS = ['portrait', 'landscape'];

// Browser configuration validation logic
export const validateBrowserConfig = (config: BrowserConfig, availableBrowsers: AvailableBrowser[]): boolean => {
  const normalizedConfig = {
    os: config.os?.toLowerCase(),
    os_version: config.os_version?.toString(),
    browser: config.browser?.toLowerCase(),
    browser_version: config.browser_version,
    device: config.device,
    device_type: config.device_type
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

  // Mobile device validation
  if (normalizedConfig.device_type === 'mobile') {
    // Check if device exists for the OS
    const isValidDevice = osMatches.some(b => b.device === normalizedConfig.device);
    if (!isValidDevice) {
      console.log(`Invalid device ${normalizedConfig.device} for ${normalizedConfig.os}`);
      return false;
    }

    // For Android, ensure version format is X.Y
    if (normalizedConfig.os === 'android' && normalizedConfig.os_version) {
      if (!normalizedConfig.os_version.includes('.')) {
        console.log(`Invalid Android version format: ${normalizedConfig.os_version}`);
        return false;
      }
    }

    return true;
  }

  // Desktop browser validation
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

  // Version validation
  if (normalizedConfig.browser_version && normalizedConfig.browser_version !== 'latest') {
    const versionExists = browserMatches.some(b => 
      b.browser_version === normalizedConfig.browser_version
    );
    if (!versionExists) {
      console.log(`Browser version ${normalizedConfig.browser_version} not found`);
      return false;
    }
  }

  return true;
};