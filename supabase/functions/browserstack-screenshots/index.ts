/// <reference types="deno" />

import { serve } from './types';
import { corsHeaders } from '../_shared/cors';
import { generateScreenshots } from './browserstack-api';
import { normalizeOsConfig } from './os-config';
import { logger } from './logger';
import { z } from 'zod';

const BrowserstackConfigSchema = z.object({
  url: z.string().url(),
  browsers: z.array(z.object({
    os: z.string(),
    os_version: z.string(),
    browser: z.string().optional(),
    browser_version: z.string().optional(),
    device: z.string().optional(),
  })),
  quality: z.enum(['compressed', 'original']).optional(),
  wait_time: z.number().min(1).max(60).optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
});
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, browsers, quality, wait_time, orientation } = await req.json();
    const requestId = crypto.randomUUID();

    logger.info({
      message: 'Processing request',
      url,
      browserCount: browsers?.length
    });

    const config = BrowserstackConfigSchema.parse({
      url,
      browsers,
      quality,
      wait_time,
      orientation,
    });

    const normalizedBrowsers = config.browsers.map(browser => normalizeOsConfig(browser));

    const result = await generateScreenshots(
      config.url,
      normalizedBrowsers,
      {
        username: Deno.env.get('BROWSERSTACK_USERNAME')!,
        password: Deno.env.get('BROWSERSTACK_ACCESS_KEY')!
      },
      {
        quality: config.quality,
        waitTime: config.wait_time,
        orientation: config.orientation,
      },
      requestId
    );

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error({
      message: 'Error processing request',
      error: error instanceof Error ? error.message : String(error)
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: error instanceof z.ZodError ? 400 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
