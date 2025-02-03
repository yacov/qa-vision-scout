import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const BROWSERSTACK_USERNAME = Deno.env.get('BROWSERSTACK_USERNAME');
const BROWSERSTACK_ACCESS_KEY = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

interface Config {
  id: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser?: string | null;
  browser_version?: string | null;
  device?: string | null;
}

class ValidationError extends Error {
  status: number;
  constructor({ message, status }: { message: string; status: number }) {
    super(message);
    this.status = status;
    this.name = 'ValidationError';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
      console.error('Missing BrowserStack credentials');
      throw new ValidationError({
        message: 'BrowserStack credentials not configured',
        status: 500
      });
    }

    const requestData = await req.json();
    console.log('Received request data:', requestData);
    
    const { config } = requestData;
    
    if (!config || !config.id || !config.device_type || !config.os || !config.os_version) {
      console.error('Invalid config in request:', config);
      throw new ValidationError({
        message: 'Invalid request data: Missing required fields',
        status: 400
      });
    }

    // Get available browsers from BrowserStack
    const browsersResponse = await fetch('https://www.browserstack.com/screenshots/browsers.json', {
      headers: {
        'Authorization': `Basic ${btoa(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`)}`,
        'Accept': 'application/json'
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

    // Basic validation logic
    const isValid = browsers.some((browser: any) => {
      if (config.device_type === 'desktop') {
        return browser.os?.toLowerCase() === config.os?.toLowerCase() &&
               browser.os_version === config.os_version &&
               (!config.browser || browser.browser?.toLowerCase() === config.browser?.toLowerCase());
      } else {
        return browser.device === config.device &&
               browser.os?.toLowerCase() === config.os?.toLowerCase() &&
               browser.os_version === config.os_version;
      }
    });

    console.log('Validation result:', isValid);

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