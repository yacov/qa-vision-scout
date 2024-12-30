import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { validateBrowserConfig } from '../browserstack-screenshots/browser-validation.ts';
import { getAvailableBrowsers } from '../browserstack-screenshots/browserstack-api.ts';

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore: Deno types
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore: Deno types
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new ValidationError({
        message: 'Missing required environment variables',
        status: 500
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await req.json();

    if (error) {
      throw new ValidationError({
        message: 'Invalid request data',
        status: 400
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new ValidationError({
        message: 'No authorization header',
        status: 401
      });
    }

    const availableBrowsers = await getAvailableBrowsers({ Authorization: authHeader });
    const isValid = validateBrowserConfig(data, availableBrowsers);

    const response: ValidationResponse = {
      isValid,
      message: isValid 
        ? 'Configuration is valid'
        : 'Configuration is invalid. Please check browser and version compatibility.',
    };

    if (!isValid && data.browser_version !== 'latest') {
      // Suggest using 'latest' version if specific version validation fails
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