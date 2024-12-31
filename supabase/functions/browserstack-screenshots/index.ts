/// <reference types="deno" />

import { generateScreenshots, type ScreenshotRequest, type BrowserstackCredentials } from './browserstack-api.ts';
import { validateRequestData } from './request-validator.ts';
import { logger } from './logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
        requestId,
        username: !!username,
        accessKey: !!accessKey
      });
      throw new Error('BrowserStack credentials not configured in environment variables');
    }

    const credentials: BrowserstackCredentials = {
      username,
      password: accessKey
    };

    // Parse and validate request body
    const data = await req.json();
    logger.info({
      message: 'Received request data',
      requestId,
      testId: data.testId,
      configCount: data.selected_configs?.length,
      url: data.url
    });

    const validatedData = validateRequestData(data, requestId);

    // Generate screenshots
    const screenshotRequest: ScreenshotRequest = {
      url: validatedData.url,
      browsers: validatedData.selected_configs.map(config => ({
        os: config.os,
        os_version: config.os_version,
        browser: config.browser,
        browser_version: config.browser_version,
        device: config.device
      })),
      wait_time: 5,
      quality: 'compressed'
    };

    logger.info({
      message: 'Generating screenshots',
      requestId,
      testId: validatedData.testId,
      url: validatedData.url,
      configCount: validatedData.selected_configs.length,
    });

    const response = await generateScreenshots(screenshotRequest, credentials, requestId);

    logger.info({
      message: 'Screenshots generated successfully',
      requestId,
      testId: validatedData.testId,
      jobId: response.job_id,
    });

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    logger.error({
      message: 'Error processing screenshot request',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: error instanceof Error && error.message.includes('validation') ? 400 : 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});