import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { validateBrowserConfig } from '../browserstack-screenshots/browser-validation.ts';

interface ValidationResponse {
  isValid: boolean;
  message?: string;
  suggestion?: {
    os_version?: string;
    browser_version?: string;
  };
}

class ValidationError extends Error {
  status: number;

  constructor({ message, status }: { message: string; status: number }) {
    super(message);
    this.status = status;
    this.name = 'ValidationError';
  }
}

// @ts-ignore: Deno types
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get BrowserStack credentials from environment
    // @ts-ignore: Deno types
    const username = Deno.env.get('BROWSERSTACK_USERNAME');
    // @ts-ignore: Deno types
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

    if (!username || !accessKey) {
      console.error('Missing BrowserStack credentials');
      throw new ValidationError({
        message: 'BrowserStack credentials not configured',
        status: 500
      });
    }

    const { configId } = await req.json();
    
    if (!configId) {
      console.error('Missing configId in request');
      throw new ValidationError({
        message: 'Invalid request data',
        status: 400
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the configuration
    const { data: config, error: fetchError } = await supabaseClient
      .from('browserstack_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (fetchError || !config) {
      console.error('Error fetching config:', fetchError);
      throw new ValidationError({
        message: 'Configuration not found',
        status: 404
      });
    }

    console.log('Validating config:', config);

    // Get available browsers from BrowserStack
    const browsersResponse = await fetch('https://api.browserstack.com/automate/browsers.json', {
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${accessKey}`)}`,
      }
    });

    if (!browsersResponse.ok) {
      console.error('Failed to fetch browsers from BrowserStack:', browsersResponse.statusText);
      throw new ValidationError({
        message: 'Failed to fetch browser configurations',
        status: 500
      });
    }

    const browsers = await browsersResponse.json();
    console.log('Available browsers:', browsers);

    const isValid = validateBrowserConfig(config, browsers);
    console.log('Validation result:', isValid);

    const response: ValidationResponse = {
      isValid,
      message: isValid 
        ? 'Configuration is valid'
        : 'Configuration is invalid. Please check browser and version compatibility.',
    };

    if (!isValid && config.browser_version !== 'latest') {
      response.suggestion = {
        browser_version: 'latest'
      };
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in validate-browserstack-config function:', error);

    const status = error instanceof ValidationError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return new Response(
      JSON.stringify({ 
        error: message,
        isValid: false
      }),
      { 
        status,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});