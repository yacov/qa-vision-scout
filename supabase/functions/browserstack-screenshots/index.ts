// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
// @ts-ignore: Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Types for Browserstack API
interface BrowserstackBrowser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface ScreenshotRequest {
  url: string;
  browsers: BrowserstackBrowser[];
  win_res?: string;
  mac_res?: string;
  quality?: 'compressed' | 'original';
  wait_time?: number;
  local?: boolean;
  orientation?: 'portrait' | 'landscape';
}

// Declare Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BROWSERSTACK_USERNAME = Deno.env.get('BROWSERSTACK_USERNAME')
const BROWSERSTACK_ACCESS_KEY = Deno.env.get('BROWSERSTACK_ACCESS_KEY')
const BROWSERSTACK_API_BASE = 'https://www.browserstack.com/screenshots'

if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
  throw new Error('Browserstack credentials not configured')
}

const authHeader = {
  'Authorization': `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`,
  'Content-Type': 'application/json'
}

// Function to fetch available browsers from BrowserStack
const getAvailableBrowsers = async (): Promise<BrowserstackBrowser[]> => {
  console.log('Fetching available browsers from BrowserStack...');
  const response = await fetch(`${BROWSERSTACK_API_BASE}/browsers.json`, {
    headers: authHeader
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch browsers:', error);
    throw new Error(`Failed to fetch browsers: ${error}`)
  }
  
  const browsers = await response.json();
  console.log('Raw browsers response:', JSON.stringify(browsers, null, 2));
  
  // Filter and normalize browser data
  const normalizedBrowsers = browsers.map((b: any) => ({
    os: b.os?.toLowerCase(),
    os_version: b.os_version,
    browser: b.browser?.toLowerCase(),
    browser_version: b.browser_version,
    device: b.device
  }));

  console.log('Normalized browsers:', JSON.stringify(normalizedBrowsers, null, 2));
  return normalizedBrowsers;
}

// Function to validate browser configuration
const validateBrowserConfig = (config: BrowserstackBrowser, availableBrowsers: BrowserstackBrowser[]): boolean => {
  const normalizedConfig = {
    os: config.os?.toLowerCase(),
    os_version: config.os_version,
    browser: config.browser?.toLowerCase(),
    browser_version: config.browser_version?.toLowerCase(),
    device: config.device
  };

  console.log('Validating config:', JSON.stringify(normalizedConfig, null, 2));
  
  // Find matching OS configurations
  const osMatches = availableBrowsers.filter(b => 
    b.os?.toLowerCase() === normalizedConfig.os &&
    b.os_version === normalizedConfig.os_version
  );

  if (osMatches.length === 0) {
    console.log(`No matching OS found for ${normalizedConfig.os} ${normalizedConfig.os_version}`);
    return false;
  }

  if (config.device) {
    // For mobile devices
    const isValid = osMatches.some(b => b.device === normalizedConfig.device);
    console.log(`Mobile device validation result for ${normalizedConfig.device}:`, isValid);
    return isValid;
  } else {
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
      console.log('Available browsers for this OS:', JSON.stringify(
        osMatches.map(b => ({ browser: b.browser, version: b.browser_version })),
        null, 2
      ));
      return false;
    }

    // Special handling for 'latest' version
    if (!normalizedConfig.browser_version || 
        normalizedConfig.browser_version === 'latest' || 
        normalizedConfig.browser_version === 'Latest') {
      // Get the highest version number for this browser
      const versions = browserMatches
        .map(b => b.browser_version)
        .filter(v => v) // Remove null/undefined
        .sort((a, b) => {
          const [aMajor = 0, aMinor = 0] = a!.split('.').map(Number);
          const [bMajor = 0, bMinor = 0] = b!.split('.').map(Number);
          return bMajor - aMajor || bMinor - aMinor;
        });
      
      console.log(`Using latest version (${versions[0]}) for ${normalizedConfig.browser}`);
      return true;
    }

    // For specific versions, check if the version exists
    const hasVersion = browserMatches.some(b => {
      const availableVersion = b.browser_version?.toLowerCase();
      console.log(`Comparing requested version ${normalizedConfig.browser_version} with available version ${availableVersion}`);
      return availableVersion === normalizedConfig.browser_version ||
             availableVersion?.startsWith(normalizedConfig.browser_version!);
    });
    
    if (!hasVersion) {
      console.log('Available versions for this browser:', JSON.stringify(
        browserMatches.map(b => b.browser_version),
        null, 2
      ));
    }
    
    console.log(`Version validation result for ${normalizedConfig.browser_version}:`, hasVersion);
    return hasVersion;
  }
}

// Function to generate screenshots
const generateScreenshots = async (settings: ScreenshotRequest): Promise<any> => {
  console.log('Generating screenshots with settings:', JSON.stringify(settings, null, 2));
  const response = await fetch(BROWSERSTACK_API_BASE, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Screenshot generation failed:', error);
    throw new Error(`Failed to generate screenshots: ${error}`)
  }

  const result = await response.json();
  console.log('Screenshot generation successful:', JSON.stringify(result, null, 2));
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { testId, baselineUrl, newUrl, configIds } = await req.json();

    console.log('Creating screenshots for test:', testId);
    console.log('Baseline URL:', baselineUrl);
    console.log('New URL:', newUrl);
    console.log('Config IDs:', configIds);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch selected configurations
    const { data: selectedConfigs, error: configError } = await supabaseClient
      .from('browserstack_configs')
      .select('*')
      .in('id', configIds);

    if (configError) {
      console.error('Error fetching configurations:', configError);
      throw new Error('Failed to fetch configurations');
    }

    if (!selectedConfigs || selectedConfigs.length === 0) {
      throw new Error('No configurations selected');
    }

    console.log('Selected configurations:', selectedConfigs);

    // Fetch available browsers from BrowserStack
    const availableBrowsers = await getAvailableBrowsers();
    console.log('Available BrowserStack configurations:', availableBrowsers);

    // Map configurations to BrowserStack format
    const browsers: BrowserstackBrowser[] = [];
    for (const config of selectedConfigs) {
      console.log('Processing config:', JSON.stringify(config, null, 2));

      const browserConfig: BrowserstackBrowser = {
        os: config.os,
        os_version: config.os_version.trim()
      };

      if (config.device_type === 'mobile') {
        browserConfig.device = config.device;
      } else {
        browserConfig.browser = config.browser;
        // Handle browser version with proper casing
        browserConfig.browser_version = config.browser_version?.toLowerCase() === 'latest' ? 'Latest' : config.browser_version;
      }

      console.log('Created browser config:', JSON.stringify(browserConfig, null, 2));

      // Validate the configuration against available browsers
      if (!validateBrowserConfig(browserConfig, availableBrowsers)) {
        const availableConfigs = availableBrowsers
          .filter(b => b.os?.toLowerCase() === browserConfig.os?.toLowerCase())
          .map(b => ({
            browser: b.browser,
            version: b.browser_version,
            os_version: b.os_version
          }));

        const errorMsg = `Invalid browser configuration for: ${config.name}. ` +
          `Requested: ${browserConfig.browser || browserConfig.device} ` +
          `on ${browserConfig.os} ${browserConfig.os_version}. ` +
          `Available configurations: ${JSON.stringify(availableConfigs, null, 2)}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`Valid ${config.device_type} configuration:`, JSON.stringify(browserConfig, null, 2));
      browsers.push(browserConfig);
    }

    // Configure screenshot settings
    const commonSettings: ScreenshotRequest = {
      quality: 'compressed' as const,
      wait_time: 5,
      local: false,
      mac_res: '1024x768',
      win_res: '1024x768',
      browsers
    }

    // Generate screenshots for baseline URL
    console.log('Generating baseline screenshots...');
    const baselineJob = await generateScreenshots({
      ...commonSettings,
      url: baselineUrl
    });

    // Generate screenshots for new URL
    console.log('Generating new version screenshots...');
    const newJob = await generateScreenshots({
      ...commonSettings,
      url: newUrl
    });

    // Update test status
    await supabaseClient
      .from('comparison_tests')
      .update({ status: 'in_progress' })
      .eq('id', testId);

    // Create screenshot records
    const screenshots = browsers.map(browser => ({
      test_id: testId,
      device_name: browser.device || `${browser.browser} on ${browser.os}`,
      os_version: browser.os_version,
      baseline_screenshot_url: null,
      new_screenshot_url: null,
      diff_percentage: null,
    }));

    await supabaseClient
      .from('test_screenshots')
      .insert(screenshots);

    console.log('Screenshot generation completed successfully');
    return new Response(
      JSON.stringify({
        baselineJob,
        newJob,
        message: 'Screenshot generation initiated',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in browserstack-screenshots function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})