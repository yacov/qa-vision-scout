import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateScreenshots } from './browserstack-api.ts';
import { normalizeOsConfig } from './os-config.ts';
import { logger } from './logger.ts';
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

type BrowserstackConfig = z.infer<typeof BrowserstackConfigSchema>;

interface BrowserstackResponse {
  job_id: string;
  screenshots: Array<{
    id: string;
    url: string;
    thumb_url: string;
    browser: {
      os: string;
      os_version: string;
      browser?: string;
      browser_version?: string;
      device?: string;
    };
    state: string;
    created_at: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, browsers, quality, wait_time, orientation } = await req.json();
    const requestId = crypto.randomUUID();

    logger.info('Received screenshot request', {
      requestId,
      url,
      browserCount: browsers?.length,
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
        quality: config.quality,
        waitTime: config.wait_time,
        orientation: config.orientation,
      },
      requestId,
    );

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('Error processing request', {
      error: error instanceof Error ? error.message : String(error),
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