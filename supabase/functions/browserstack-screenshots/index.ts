// Main edge function handler
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getAvailableBrowsers, generateScreenshots } from "./browserstack-api.ts";
import { createSupabaseClient, updateTestStatus, createScreenshotRecords } from "./database.ts";
import { normalizeOsConfig } from "./os-config.ts";

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const availableBrowsers = await getAvailableBrowsers({
      'Authorization': `Basic ${btoa(`${Deno.env.get('BROWSERSTACK_USERNAME')}:${Deno.env.get('BROWSERSTACK_ACCESS_KEY')}`)}`,
      'Content-Type': 'application/json'
    });
    
    console.log('Available BrowserStack configurations:', availableBrowsers);

    // Map configurations to BrowserStack format
    const browsers: BrowserstackBrowser[] = [];
    for (const config of selectedConfigs) {
      console.log('Processing config:', JSON.stringify(config, null, 2));
      
      const normalizedConfig = normalizeOsConfig(config);
      console.log('Normalized config:', JSON.stringify(normalizedConfig, null, 2));

      const browserConfig: BrowserstackBrowser = {
        os: normalizedConfig.os,
        os_version: normalizedConfig.os_version,
        browser: undefined,
        browser_version: undefined,
        device: undefined
      };

      if (config.device_type === 'mobile') {
        browserConfig.device = config.device;
      } else {
        browserConfig.browser = config.browser?.toLowerCase();
        browserConfig.browser_version = config.browser_version?.toLowerCase() === 'latest' ? null : config.browser_version;
      }

      console.log('Created browser config:', JSON.stringify(browserConfig, null, 2));
      browsers.push(browserConfig);
    }

    // Configure screenshot settings
    const screenshotSettings: ScreenshotRequest = {
      url: baselineUrl,
      browsers,
      quality: 'original',
      wait_time: 5,
      orientation: 'portrait'
    };

    // Add resolution settings based on device type
    if (browsers.some(b => !b.device)) {
      screenshotSettings.win_res = '1920x1080';
      screenshotSettings.mac_res = '1920x1080';
    }

    console.log('Sending screenshot request with settings:', JSON.stringify(screenshotSettings, null, 2));

    // Generate screenshots for baseline URL
    console.log('Generating baseline screenshots...');
    const baselineJob = await generateScreenshots({
      ...screenshotSettings,
      url: baselineUrl
    }, {
      'Authorization': `Basic ${btoa(`${Deno.env.get('BROWSERSTACK_USERNAME')}:${Deno.env.get('BROWSERSTACK_ACCESS_KEY')}`)}`,
      'Content-Type': 'application/json'
    });

    // Generate screenshots for new URL
    console.log('Generating new version screenshots...');
    const newJob = await generateScreenshots({
      ...screenshotSettings,
      url: newUrl
    }, {
      'Authorization': `Basic ${btoa(`${Deno.env.get('BROWSERSTACK_USERNAME')}:${Deno.env.get('BROWSERSTACK_ACCESS_KEY')}`)}`,
      'Content-Type': 'application/json'
    });

    // Update test status and create screenshot records
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