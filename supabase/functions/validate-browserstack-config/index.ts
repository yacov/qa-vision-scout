import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.js';
import { validateBrowserConfig } from '../browserstack-screenshots/browser-validation.js';
import { getAvailableBrowsers } from '../browserstack-screenshots/browserstack-api.js';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config } = await req.json();

    const username = Deno.env.get('BROWSERSTACK_USERNAME');
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

    if (!username || !accessKey) {
      throw new Error('BrowserStack credentials not configured');
    }

    const authHeader = {
      'Authorization': `Basic ${btoa(`${username}:${accessKey}`)}`
    };

    const browsers = await getAvailableBrowsers(authHeader);
    const isValid = validateBrowserConfig(config, browsers);

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        message: isValid ? 'Configuration is valid' : 'Configuration is not supported by BrowserStack'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});