import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateScreenshots } from './browserstack-api.ts';
import { validateRequestData } from './request-validator.ts';
import { logger } from './utils/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

async function handler(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get BrowserStack credentials from environment
    const username = Deno.env.get('BROWSERSTACK_USERNAME');
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

    if (!username || !accessKey) {
      logger.error({
        message: 'Missing BrowserStack credentials in environment',
        requestId
      });
      return new Response(
        JSON.stringify({
          error: 'BrowserStack credentials not configured'
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    const credentials = { username, accessKey };

    // Parse and validate request body
    let data;
    try {
      data = await req.json();
    } catch (error) {
      logger.error({
        message: 'Failed to parse request body as JSON',
        requestId,
        error: error?.message || String(error)
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error?.message || 'Failed to parse JSON'
        }),
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

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