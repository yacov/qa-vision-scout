import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAvailableBrowsers, generateScreenshots } from "./browserstack-api.js";
import { createSupabaseClient, updateTestStatus, createScreenshotRecords } from "./database.js";
import { normalizeOsConfig } from "./os-config.js";

interface BrowserstackBrowser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface ScreenshotRequest {
  testId: string;
  baselineUrl: string;
  newUrl: string;
  configIds: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testId, baselineUrl, newUrl, configIds }: ScreenshotRequest = await req.json();

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

    const authHeader = {
      'Authorization': `Basic ${btoa(`${Deno.env.get('BROWSERSTACK_USERNAME')}:${Deno.env.get('BROWSERSTACK_ACCESS_KEY')}`)}`,
      'Content-Type': 'application/json'
    };

    const browsers: BrowserstackBrowser[] = selectedConfigs.map(config => {
      const normalizedConfig = normalizeOsConfig(config);
      return {
        os: normalizedConfig.os,
        os_version: normalizedConfig.os_version,
        ...(config.device_type === 'mobile' 
          ? { device: config.device }
          : { 
              browser: config.browser?.toLowerCase(),
              browser_version: config.browser_version?.toLowerCase() === 'latest' ? null : config.browser_version
            }
        )
      };
    });

    const screenshotSettings = {
      browsers,
      quality: 'original' as const,
      wait_time: 5 as const,
      orientation: 'portrait' as const,
      win_res: '1920x1080' as const,
      mac_res: '1920x1080' as const
    };

    console.log('Generating baseline screenshots...');
    const baselineJob = await generateScreenshots({
      ...screenshotSettings,
      url: baselineUrl
    }, authHeader);

    console.log('Generating new version screenshots...');
    const newJob = await generateScreenshots({
      ...screenshotSettings,
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
  } catch (error: unknown) {
    console.error('Error in browserstack-screenshots function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});