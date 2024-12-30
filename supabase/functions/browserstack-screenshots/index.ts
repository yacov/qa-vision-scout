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
  console.log('Available browsers from BrowserStack:', browsers);
  return browsers;
}

// Function to validate and format browser version
const validateBrowserVersion = (version: string | null | undefined): string | null => {
  if (!version || version === 'null' || version.trim() === '') {
    return null;
  }
  
  const trimmedVersion = version.trim().toLowerCase();
  
  // Special handling for 'latest'
  if (trimmedVersion === 'latest') {
    return 'latest';
  }

  // Check if version is in valid format (e.g., "121.0" or "11")
  const versionRegex = /^\d+(\.\d+)?$/;
  if (!versionRegex.test(trimmedVersion)) {
    console.error('Invalid browser version format:', trimmedVersion);
    throw new Error(`Invalid browser version format: ${trimmedVersion}`);
  }

  return trimmedVersion;
}

// Function to validate browser configuration
const validateBrowserConfig = (config: BrowserstackBrowser, availableBrowsers: BrowserstackBrowser[]): boolean => {
  console.log('Validating config:', JSON.stringify(config, null, 2));
  
  if (!config.os || !config.os_version) {
    console.error('Missing required OS information');
    return false;
  }

  if (config.device) {
    // For mobile devices
    const isValid = availableBrowsers.some(b => 
      b.os?.toLowerCase() === config.os?.toLowerCase() &&
      b.os_version === config.os_version &&
      b.device === config.device
    );
    console.log('Mobile device validation result:', isValid);
    return isValid;
  } else {
    // For desktop browsers
    if (!config.browser) {
      console.error('Missing browser information for desktop configuration');
      return false;
    }

    const matchingBrowsers = availableBrowsers.filter(b => 
      b.os?.toLowerCase() === config.os?.toLowerCase() &&
      b.os_version === config.os_version &&
      b.browser?.toLowerCase() === config.browser?.toLowerCase()
    );

    console.log(`Found ${matchingBrowsers.length} matching browsers for ${config.browser} on ${config.os} ${config.os_version}`);

    if (matchingBrowsers.length === 0) {
      console.log('No matching browsers found');
      return false;
    }

    // If browser_version is 'latest' or not specified, consider it valid
    if (!config.browser_version || config.browser_version.toLowerCase() === 'latest') {
      console.log('Using latest browser version');
      return true;
    }

    // For specific versions, check if the version exists
    const hasVersion = matchingBrowsers.some(b => 
      b.browser_version === config.browser_version ||
      b.browser_version?.startsWith(config.browser_version!)
    );
    
    console.log(`Version validation result for ${config.browser_version}:`, hasVersion);
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
        // Simplified version handling
        browserConfig.browser_version = config.browser_version?.toLowerCase() === 'latest' ? 'latest' : config.browser_version;
      }

      // Validate the configuration against available browsers
      if (!validateBrowserConfig(browserConfig, availableBrowsers)) {
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
