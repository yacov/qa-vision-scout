import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateScreenshots } from "./browserstack-api.ts";
import { normalizeOsConfig } from "./os-config.ts";
import { createSupabaseClient } from "./database.ts";

interface BrowserstackConfig {
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface BrowserstackBrowser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { baseline_url, new_url, selected_configs } = await req.json();
    if (!baseline_url || !new_url || !selected_configs) {
      throw new Error('Missing required parameters');
    }

    const supabase = createSupabaseClient();

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json'
    };

    const browsers: BrowserstackBrowser[] = selected_configs.map((config: BrowserstackConfig) => {
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
      url: baseline_url,
      browsers,
      wait_time: 5 as const,
      quality: "compressed" as const,
    };

    const screenshotResponse = await generateScreenshots(screenshotSettings, { Authorization: authHeader });
    return new Response(JSON.stringify(screenshotResponse), {
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('Error in browserstack-screenshots function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});