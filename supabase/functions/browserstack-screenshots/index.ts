/// <reference types="deno" />

import { generateScreenshots } from './browserstack-api.ts';
import type { ScreenshotRequest, BrowserstackCredentials } from './types/api-types.ts';
import { validateRequestData } from './request-validator.ts';
import { logger } from './logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore: Deno Deploy runtime provides serve
Deno.serve(async (req: Request) => {
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
    logger.debug({
      message: 'Raw request data',
      requestId,
      data
    });

    logger.info({
      message: 'Received request data',
      requestId,
      testId: data.testId,
      url: data.url,
      configCount: data.selected_configs?.length
    });

    const validatedData = validateRequestData(data, requestId);

    if (!validatedData.url || !validatedData.selected_configs) {
      throw new Error('Missing required fields after validation');
    }

    logger.debug({
      message: 'Validated request data',
      requestId,
      validatedData
    });

    // Map request data to Browserstack API format
    const screenshotRequest: ScreenshotRequest = {
      url: validatedData.url,
      browsers: validatedData.selected_configs.map((config: { os: string; os_version: string; browser?: string; browser_version?: string; device?: string }) => ({
        os: config.os,
        os_version: config.os_version,
        ...(config.browser && { browser: config.browser }),
        ...(config.browser_version && { browser_version: config.browser_version }),
        ...(config.device && { device: config.device })
      }))
    };

    logger.debug({
      message: 'Mapped request data to Browserstack format',
      requestId,
      screenshotRequest
    });

    // Generate screenshots
    const result = await generateScreenshots(screenshotRequest, credentials);

    logger.info({
      message: 'Screenshots generated successfully',
      requestId,
      testId: validatedData.testId,
      jobId: result.id,
    });

    return new Response(
      JSON.stringify(result),
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

    let status = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        status = 400;
        errorMessage = error.message;
      } else if ('statusCode' in error) {
        status = (error as { statusCode: number }).statusCode;
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      { 
        status,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});