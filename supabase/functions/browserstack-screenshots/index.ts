// Main edge function handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAvailableBrowsers, generateScreenshots } from "./browserstack-api.ts";
import { createSupabaseClient, updateTestStatus, createScreenshotRecords } from "./database.ts";

// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
};

const BROWSERSTACK_USERNAME = Deno.env.get('BROWSERSTACK_USERNAME');
const BROWSERSTACK_ACCESS_KEY = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
  throw new Error('Browserstack credentials not configured');
}

const authHeader = {
  'Authorization': `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`,
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { testId, baselineUrl, newUrl, configIds, url, orientation } = await req.json();

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
    const availableBrowsers = await getAvailableBrowsers(authHeader);
    console.log('Available BrowserStack configurations:', availableBrowsers);

    // Map configurations to BrowserStack format
    const browsers: BrowserstackBrowser[] = [];
    for (const config of selectedConfigs) {
      console.log('Processing config:', JSON.stringify(config, null, 2));

      // Normalize Windows version names
      const normalizeWindowsVersion = (version: string) => {
        const versionMap: { [key: string]: string } = {
          '11': '11',
          '10': '10',
          'windows 11': '11',
          'windows 10': '10'
        };
        return versionMap[version.toLowerCase()] || version;
      };

      const browserConfig: BrowserstackBrowser = {
        os: config.os === 'Windows' ? 'Windows' : config.os, // Preserve Windows casing
        os_version: normalizeWindowsVersion(config.os_version.trim()),
        browser: undefined,
        browser_version: undefined,
        device: undefined
      };

      if (config.device_type === 'mobile') {
        browserConfig.device = config.device;
      } else {
        browserConfig.browser = config.browser;
        // Handle browser version with proper casing
        browserConfig.browser_version = config.browser_version?.toLowerCase() === 'latest' ? 'Latest' : config.browser_version;
      }

      console.log('Created browser config:', JSON.stringify(browserConfig, null, 2));

      // Skip validation for now
      console.log(`Processing ${config.device_type} configuration:`, JSON.stringify(browserConfig, null, 2));
      browsers.push(browserConfig);
    }

    // Configure screenshot settings
    const screenshotSettings: ScreenshotRequest = {
      url: url,
      browsers,
      quality: 'original',
      wait_time: 5,  // 5 seconds wait time for page load
      orientation: orientation || 'portrait'
    };

    // Add resolution settings based on device type
    if (browsers.some(b => !b.device)) {  // If any desktop browsers
      screenshotSettings.win_res = '1920x1080';
      screenshotSettings.mac_res = '1920x1080';
    }

    console.log('Sending screenshot request with settings:', JSON.stringify(screenshotSettings, null, 2));

    // Generate screenshots for baseline URL
    console.log('Generating baseline screenshots...');
    const baselineJob = await generateScreenshots({
      ...screenshotSettings,
      url: baselineUrl
    }, authHeader);

    // Generate screenshots for new URL
    console.log('Generating new version screenshots...');
    const newJob = await generateScreenshots({
      ...screenshotSettings,
      url: newUrl
    }, authHeader);

    // Update test status
    await updateTestStatus(supabaseClient, testId, 'in_progress');
    await createScreenshotRecords(supabaseClient, testId, browsers);

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
});