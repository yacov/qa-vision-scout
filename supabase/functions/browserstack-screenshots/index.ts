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

    const requestData = await req.json();
    console.log('Received request data:', JSON.stringify(requestData, null, 2));

    // Validate required parameters
    const { url, selected_configs } = requestData;
    if (!url) {
      throw new Error('Missing required parameter: url');
    }
    if (!Array.isArray(selected_configs) || selected_configs.length === 0) {
      throw new Error('Missing required parameter: selected_configs must be a non-empty array');
    }

    const supabase = createSupabaseClient();

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json'
    };

    const browsers: BrowserstackBrowser[] = selected_configs.map((config: BrowserstackConfig) => {
      if (!config.os || !config.os_version || !config.device_type) {
        throw new Error('Invalid browser configuration: missing required fields (os, os_version, device_type)');
      }

      const normalizedConfig = normalizeOsConfig(config);
      const browserConfig: BrowserstackBrowser = {
        os: normalizedConfig.os,
        os_version: normalizedConfig.os_version
      };

      if (config.device_type === 'mobile') {
        if (!config.device) {
          throw new Error('Device name is required for mobile configurations');
        }
        browserConfig.device = config.device;
      } else {
        if (!config.browser) {
          throw new Error('Browser name is required for desktop configurations');
        }
        if (!config.browser_version) {
          throw new Error('Browser version is required for desktop configurations');
        }
        browserConfig.browser = config.browser.toLowerCase();
        browserConfig.browser_version = config.browser_version.toLowerCase() === 'latest' ? 'latest' : config.browser_version;
      }

      return browserConfig;
    });

    const screenshotSettings = {
      url,
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
        status: 400, // Changed to 400 for validation errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});