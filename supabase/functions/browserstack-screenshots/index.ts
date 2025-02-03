import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateScreenshots } from './browserstack-api.ts';
import { validateRequestData } from './request-validator.ts';
import { logger } from './utils/logger.ts';
import { createSupabaseClient } from './database.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export async function handler(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Log environment variables (excluding sensitive values)
    logger.info({
      message: 'Environment check',
      requestId,
      envVars: {
        BROWSERSTACK_USERNAME: !!Deno.env.get('BROWSERSTACK_USERNAME'),
        BROWSERSTACK_ACCESS_KEY: !!Deno.env.get('BROWSERSTACK_ACCESS_KEY'),
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY')
      }
    });

    // Get BrowserStack credentials from environment
    const username = Deno.env.get('BROWSERSTACK_USERNAME');
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

    if (!username || !accessKey) {
      logger.error({
        message: 'Missing BrowserStack credentials in environment',
        requestId
      });
      throw new Error('BrowserStack credentials not configured');
    }

    const credentials = { username, accessKey };

    // Parse and validate request body
    const data = await req.json();
    logger.info({
      message: 'Received request data',
      requestId,
      url: data.url
    });

    const validatedData = validateRequestData(data, requestId);

    // Generate screenshots
    const result = await generateScreenshots(validatedData, credentials);
    
    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );

  } catch (error: any) {
    logger.error({
      message: 'Error in browserstack-screenshots function',
      requestId,
      error: error?.message || String(error),
      stack: error?.stack
    });

    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error',
        type: error?.name || 'UnknownError'
      }),
      { 
        headers: corsHeaders,
        status: error?.statusCode === 429 ? 429 : 400
      }
    );
  }
}

serve(handler);