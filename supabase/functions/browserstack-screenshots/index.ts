// Main edge function handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAvailableBrowsers, generateScreenshots } from "./browserstack-api.ts";
import { validateBrowserConfig } from "./browser-validation.ts";
import { createSupabaseClient, updateTestStatus, createScreenshotRecords } from "./database.ts";

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { testId, baselineUrl, newUrl, configIds } = await req.json();
    console.log('Creating screenshots for test:', testId);
    console.log('Baseline URL:', baselineUrl);
    console.log('New URL:', newUrl);
    console.log('Config IDs:', configIds);

    const supabaseClient = createSupabaseClient();

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

    const availableBrowsers = await getAvailableBrowsers(authHeader);
    console.log('Available BrowserStack configurations:', availableBrowsers);

    const browsers = selectedConfigs.map(config => {
      const browserConfig = {
        os: config.os,
        os_version: config.os_version.trim(),
        ...(config.device_type === 'mobile' 
          ? { device: config.device }
          : { 
              browser: config.browser,
              browser_version: config.browser_version?.toLowerCase() === 'latest' ? 'Latest' : config.browser_version
            }
        )
      };

      if (!validateBrowserConfig(browserConfig, availableBrowsers)) {
        throw new Error(`Invalid browser configuration for: ${config.name}. Requested: ${browserConfig.browser || browserConfig.device} on ${browserConfig.os} ${browserConfig.os_version}`);
      }

      return browserConfig;
    });

    const commonSettings = {
      quality: 'compressed' as const,
      wait_time: 5,
      local: false,
      mac_res: '1024x768',
      win_res: '1024x768',
      browsers
    };

    console.log('Generating baseline screenshots...');
    const baselineJob = await generateScreenshots({
      ...commonSettings,
      url: baselineUrl
    }, authHeader);

    console.log('Generating new version screenshots...');
    const newJob = await generateScreenshots({
      ...commonSettings,
      url: newUrl
    }, authHeader);

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
    );
  } catch (error) {
    console.error('Error in browserstack-screenshots function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});