import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateScreenshots } from './browserstack-api.ts';
import { validateRequestData } from './request-validator.ts';
import { logger } from './utils/logger.ts';
import { createSupabaseClient } from './database.ts';
import type { Browser, ScreenshotInput } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        requestId,
        username: !!username,
        accessKey: !!accessKey
      });
      throw new Error('BrowserStack credentials not configured in environment variables');
    }

    const credentials = {
      username,
      accessKey
    };

    // Parse and validate request body
    const data = await req.json();
    logger.info({
      message: 'Received request data',
      requestId,
      testId: data.testId,
      configCount: data.selected_configs?.length,
      url: data.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    const validatedData = validateRequestData(data, requestId);

    // Create initial database entry
    const supabase = createSupabaseClient();
    const { data: screenshotEntry, error: dbError } = await supabase
      .from('screenshots')
      .insert({
        url: validatedData.url,
        status: 'queued',
        test_id: data.testId
      })
      .select()
      .single();

    if (dbError) {
      logger.error({
        message: 'Failed to create database entry',
        requestId,
        error: dbError
      });
      throw dbError;
    }

    // Generate webhook URL
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/browserstack-webhook`;

    // Generate screenshots
    const result = await generateScreenshots({
      url: validatedData.url,
      selected_configs: validatedData.selected_configs,
      callback_url: webhookUrl,
      wait_time: 5,
      quality: 'compressed'
    }, credentials);

    // Update database with job ID
    const { error: updateError } = await supabase
      .from('screenshots')
      .update({ 
        job_id: result.job_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', screenshotEntry.id);

    if (updateError) {
      logger.error({
        message: 'Failed to update job ID',
        requestId,
        error: updateError
      });
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        ...result,
        id: screenshotEntry.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error?.statusCode === 429 ? 429 : 400
      }
    );
  }
}

serve(handler);