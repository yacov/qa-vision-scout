import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Browserstack API configuration
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
  const response = await fetch(`${BROWSERSTACK_API_BASE}/browsers.json`, {
    headers: authHeader
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch browsers:', error);
    throw new Error(`Failed to fetch browsers: ${error}`);
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

  console.log('Validating normalized config:', JSON.stringify(normalizedConfig, null, 2));
  
  if (!normalizedConfig.os || !normalizedConfig.os_version) {
    console.error('Missing required OS information');
    return false;
  }

  // Log all available combinations for this OS
  const osMatches = availableBrowsers.filter(b => b.os === normalizedConfig.os);
  console.log(`Available configurations for ${normalizedConfig.os}:`, JSON.stringify(osMatches, null, 2));

  if (config.device) {
    // For mobile devices
    const isValid = availableBrowsers.some(b => 
      b.os === normalizedConfig.os &&
      b.os_version === normalizedConfig.os_version &&
      b.device === normalizedConfig.device
    );
    console.log('Mobile device validation result:', isValid);
    return isValid;
  } else {
    // For desktop browsers
    if (!normalizedConfig.browser) {
      console.error('Missing browser information for desktop configuration');
      return false;
    }

    // Log all available browsers for this OS version
    const osVersionMatches = osMatches.filter(b => b.os_version === normalizedConfig.os_version);
    console.log(`Available browsers for ${normalizedConfig.os} ${normalizedConfig.os_version}:`, 
      JSON.stringify(osVersionMatches, null, 2));

    const matchingBrowsers = osVersionMatches.filter(b => b.browser === normalizedConfig.browser);
    console.log(`Matching browsers for ${normalizedConfig.browser}:`, 
      JSON.stringify(matchingBrowsers, null, 2));

    if (matchingBrowsers.length === 0) {
      console.log('No matching browsers found');
      return false;
    }

    // If browser_version is 'latest' or not specified, consider it valid
    if (!normalizedConfig.browser_version || normalizedConfig.browser_version === 'latest') {
      console.log('Using latest browser version');
      return true;
    }

    // For specific versions, check if the version exists
    const hasVersion = matchingBrowsers.some(b => {
      const normalizedAvailableVersion = b.browser_version?.toLowerCase();
      console.log(`Comparing requested version ${normalizedConfig.browser_version} with available version ${normalizedAvailableVersion}`);
      return normalizedAvailableVersion === normalizedConfig.browser_version ||
             normalizedAvailableVersion?.startsWith(normalizedConfig.browser_version!);
    });
    
    console.log(`Version validation result for ${normalizedConfig.browser_version}:`, hasVersion);
    return hasVersion;
  }
}

// Function to generate screenshots
const generateScreenshots = async (settings: ScreenshotRequest): Promise<any> => {
  const response = await fetch(BROWSERSTACK_API_BASE, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate screenshots: ${error}`);
  }

  return response.json();
}

serve(async (req) => {
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
        // Handle 'latest' version
        browserConfig.browser_version = config.browser_version === 'latest' ? 'latest' : config.browser_version;
      }

      console.log('Created browser config:', JSON.stringify(browserConfig, null, 2));

      // Validate the configuration against available browsers
      if (!validateBrowserConfig(browserConfig, availableBrowsers)) {
        // Log available configurations for debugging
        console.log('Available configurations for this OS:', 
          JSON.stringify(availableBrowsers.filter(b => 
            b.os?.toLowerCase() === browserConfig.os?.toLowerCase()
          ), null, 2)
        );

        const errorMsg = `Invalid browser configuration for: ${config.name}. ` +
          `Requested: ${browserConfig.browser || browserConfig.device} ` +
          `on ${browserConfig.os} ${browserConfig.os_version}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`Valid ${config.device_type} configuration:`, JSON.stringify(browserConfig, null, 2));
      browsers.push(browserConfig);
    }

    // Configure screenshot settings
    const commonSettings: ScreenshotRequest = {
      quality: 'compressed',
      wait_time: 5,
      local: false,
      mac_res: '1024x768',
      win_res: '1024x768',
      browsers
    }

    // Generate screenshots for baseline URL
    const baselineJob = await generateScreenshots({
      ...commonSettings,
      url: baselineUrl
    });

    // Generate screenshots for new URL
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
