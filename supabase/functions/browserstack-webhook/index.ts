import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from '../_shared/cors.ts';
import { logger } from '../browserstack-screenshots/utils/logger.ts';

interface Screenshot {
  id: string;
  state: string;
  url: string;
  thumb_url: string;
  image_url: string;
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
  created_at: string;
}

interface WebhookData {
  job_id: string;
  state: string;
  screenshots: Screenshot[];
}

const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  return createClient(supabaseUrl, supabaseKey);
};

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const supabase = createSupabaseClient();
    const data: WebhookData = await req.json();

    logger.info({
      message: 'Received BrowserStack webhook',
      requestId,
      jobId: data.job_id,
      state: data.state,
      screenshotCount: data.screenshots.length
    });

    // Update job status in screenshots table
    const { error: jobError } = await supabase
      .from('screenshots')
      .update({ 
        status: data.state,
        updated_at: new Date().toISOString()
      })
      .eq('job_id', data.job_id);

    if (jobError) {
      logger.error({
        message: 'Failed to update job status',
        requestId,
        error: jobError
      });
      throw jobError;
    }

    // Process each screenshot
    for (const screenshot of data.screenshots) {
      const { error: screenshotError } = await supabase
        .from('test_screenshots')
        .upsert({
          id: screenshot.id,
          device_name: screenshot.device || `${screenshot.browser} ${screenshot.browser_version}`,
          os_version: screenshot.os_version,
          baseline_screenshot_url: screenshot.image_url,
          created_at: screenshot.created_at,
          status: screenshot.state
        });

      if (screenshotError) {
        logger.error({
          message: 'Failed to store screenshot data',
          requestId,
          screenshotId: screenshot.id,
          error: screenshotError
        });
        throw screenshotError;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    logger.error({
      message: 'Error processing webhook',
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 