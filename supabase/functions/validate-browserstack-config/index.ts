import { createClient } from '@supabase/supabase-js';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { validateBrowserConfig } from '../browserstack-screenshots/browser-validation.ts';
import { getAvailableBrowsers } from '../browserstack-screenshots/browserstack-api.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const username = Deno.env.get('BROWSERSTACK_USERNAME');
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

    if (!username || !accessKey) {
      throw new Error('BrowserStack credentials not configured');
    }

    const { config } = await req.json();
    if (!config) {
      throw new Error('No configuration provided');
    }

    const authHeaders = {
      'Authorization': `Basic ${btoa(`${username}:${accessKey}`)}`
    };
    
    const availableBrowsers = await getAvailableBrowsers(authHeaders);
    const validationResult = validateBrowserConfig(config, availableBrowsers);

    return new Response(
      JSON.stringify(validationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error: unknown) {
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