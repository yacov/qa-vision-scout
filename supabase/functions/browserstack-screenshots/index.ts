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
    throw new Error(`Failed to fetch browsers: ${error}`);
  }
  
  return response.json();
}

// Function to validate and format browser version
const validateBrowserVersion = (version: string | null | undefined): string | null => {
  if (!version || version === 'null' || version.trim() === '') {
    return null
  }
  
  const trimmedVersion = version.trim().toLowerCase()
  if (trimmedVersion === 'latest') {
    return 'latest'
  }

  // Check if version is in valid format (e.g., "121.0" or "11")
  const versionRegex = /^\d+(\.\d+)?$/
  if (!versionRegex.test(trimmedVersion)) {
    console.error('Invalid browser version format:', trimmedVersion)
    throw new Error(`Invalid browser version format: ${trimmedVersion}`)
  }

  return trimmedVersion
}

// Function to validate browser configuration
const validateBrowserConfig = (config: BrowserstackBrowser, availableBrowsers: BrowserstackBrowser[]): boolean => {
  console.log('Validating config:', config);
  console.log('Available browsers:', availableBrowsers);

  if (config.device) {
    // For mobile devices
    return availableBrowsers.some(b => 
      b.os === config.os &&
      b.os_version === config.os_version &&
      b.device === config.device
    )
  } else {
    // For desktop browsers
    const matchingBrowsers = availableBrowsers.filter(b => 
      b.os === config.os &&
      b.os_version === config.os_version &&
      b.browser === config.browser
    )

    console.log('Matching browsers:', matchingBrowsers);

    if (matchingBrowsers.length === 0) return false

    // If browser_version is 'latest' or not specified, it's valid
    if (!config.browser_version || config.browser_version === 'latest') {
      return true
    }

    // Otherwise, check for exact version match
    return matchingBrowsers.some(b => b.browser_version === config.browser_version)
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { testId, baselineUrl, newUrl, configIds } = await req.json()

    console.log('Creating screenshots for test:', testId)
    console.log('Baseline URL:', baselineUrl)
    console.log('New URL:', newUrl)
    console.log('Config IDs:', configIds)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch selected configurations
    const { data: selectedConfigs, error: configError } = await supabaseClient
      .from('browserstack_configs')
      .select('*')
      .in('id', configIds)

    if (configError) {
      console.error('Error fetching configurations:', configError)
      throw new Error('Failed to fetch configurations')
    }

    if (!selectedConfigs || selectedConfigs.length === 0) {
      throw new Error('No configurations selected')
    }

    console.log('Selected configurations:', selectedConfigs)

    // Fetch available browsers from BrowserStack
    const availableBrowsers = await getAvailableBrowsers()
    console.log('Available BrowserStack configurations:', availableBrowsers)

    // Map configurations to BrowserStack format
    const browsers: BrowserstackBrowser[] = []
    for (const config of selectedConfigs) {
      // Validate and format os_version
      if (!config.os_version || config.os_version.trim() === '' || config.os_version === 'null') {
        console.error('Invalid os_version for config:', config)
        throw new Error(`Invalid os_version for configuration: ${config.name}`)
      }

      const browserConfig: BrowserstackBrowser = {
        os: config.os,
        os_version: config.os_version.trim()
      }

      if (config.device_type === 'mobile') {
        browserConfig.device = config.device
      } else {
        browserConfig.browser = config.browser
        // Handle 'latest' version specially
        browserConfig.browser_version = config.browser_version === 'latest' ? 'latest' : validateBrowserVersion(config.browser_version)
      }

      // Validate the configuration against available browsers
      if (!validateBrowserConfig(browserConfig, availableBrowsers)) {
        console.error('Invalid browser configuration:', browserConfig)
        throw new Error(`Invalid browser configuration for: ${config.name}. Please check available browsers and versions.`)
      }

      console.log(`Valid ${config.device_type} configuration:`, browserConfig)
      browsers.push(browserConfig)
    }

    console.log('Mapped browser configurations:', browsers)

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
    })

    // Generate screenshots for new URL
    const newJob = await generateScreenshots({
      ...commonSettings,
      url: newUrl
    })

    // Update test status
    await supabaseClient
      .from('comparison_tests')
      .update({ status: 'in_progress' })
      .eq('id', testId)

    // Create screenshot records
    const screenshots = browsers.map(browser => ({
      test_id: testId,
      device_name: browser.device || `${browser.browser} on ${browser.os}`,
      os_version: browser.os_version,
      baseline_screenshot_url: null,
      new_screenshot_url: null,
      diff_percentage: null,
    }))

    await supabaseClient
      .from('test_screenshots')
      .insert(screenshots)

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
    console.error('Error in browserstack-screenshots function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
