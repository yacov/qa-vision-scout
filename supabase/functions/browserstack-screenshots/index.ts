/// <reference types="deno" />

import { generateScreenshots } from './browserstack-api';
import { BrowserstackCredentials, ScreenshotInput } from './types';
import { BrowserstackError } from './utils/errors';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const handler = async (request: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { url, selected_configs, callback_url } = await request.json();
    const credentials: BrowserstackCredentials = {
      username: process.env.BROWSERSTACK_USERNAME || '',
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY || ''
    };

    const input: ScreenshotInput = {
      url,
      selected_configs,
      callback_url
    };

    const result = await generateScreenshots(input, credentials);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const status = error instanceof BrowserstackError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';

    return new Response(JSON.stringify({ message }), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
};