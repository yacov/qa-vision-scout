/// <reference types="deno" />

import { generateScreenshots as generateBrowserstackScreenshots, type ScreenshotRequest, type ScreenshotResponse, type BrowserstackCredentials } from './browserstack-api.ts';
import { validateRequestData } from './request-validator.ts';
import { logger } from './logger.ts';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const requestId = crypto.randomUUID();
    logger.info({
      message: 'Processing screenshot generation request',
      requestId,
      method: req.method,
    });

    // Get BrowserStack credentials from environment
    const username = Deno.env.get('BROWSERSTACK_USERNAME');
    const accessKey = Deno.env.get('BROWSERSTACK_ACCESS_KEY');

    if (!username || !accessKey) {
      logger.error({
        message: 'Missing BrowserStack credentials',
        requestId,
      });
      throw new Error('BrowserStack credentials not configured');
    }

    // Parse and validate request body
    const requestData = await req.json();
    logger.info({
      message: 'Received request data',
      requestId,
      testId: requestData.testId,
      configCount: requestData.selected_configs?.length,
    });

    const validatedData = validateRequestData(requestData, requestId);

    // Generate screenshots for both URLs
    const baselineRequest: ScreenshotRequest = {
      url: validatedData.url,
      resolution: 'WINDOWS',
      browsers: validatedData.selected_configs.map(config => ({
        os: config.os,
        os_version: config.os_version,
        browser: config.browser || undefined,
        browser_version: config.browser_version || undefined,
        device: config.device || undefined
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

    const credentials: BrowserstackCredentials = {
      username,
      password: accessKey
    };

    const response = await generateBrowserstackScreenshots(baselineRequest, credentials);

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