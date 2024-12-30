import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateScreenshots } from "./browserstack-api.ts";
import { normalizeOsConfig } from "./os-config.ts";
import { validateRequestData } from "./request-validator.ts";
import { logger } from "./logger.ts";

export const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  logger.info('Received new request', { requestId, method: req.method, url: req.url });

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header', { requestId });
      throw new Error('No authorization header');
    }

    const requestData = await req.json();
    logger.info('Received request data', {
      requestId,
      url: requestData.baselineUrl,
      configCount: requestData.configIds?.length
    });

    // Validate request data
    const validatedData = validateRequestData(requestData, requestId);

    const browsers = validatedData.selected_configs.map((config: any, index: number) => {
      logger.info('Processing browser configuration', {
        requestId,
        configIndex: index,
        deviceType: config.device_type,
        os: config.os,
        osVersion: config.os_version
      });

      const normalizedConfig = normalizeOsConfig(config);
      logger.info('Normalized OS config', {
        requestId,
        configIndex: index,
        originalOs: config.os,
        normalizedOs: normalizedConfig.os,
        originalVersion: config.os_version,
        normalizedVersion: normalizedConfig.os_version
      });

      return {
        os: normalizedConfig.os.toLowerCase(),
        os_version: normalizedConfig.os_version,
        device: config.device,
        browser: config.browser?.toLowerCase(),
        browser_version: config.browser_version
      };
    });

    const screenshotSettings = {
      url: validatedData.url,
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
      url: validatedData.url,
      browserCount: browsers.length,
      settings: screenshotSettings
    });

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('Error processing request', {
      error: error instanceof Error ? error.message : String(error),
    const screenshotResponse = await generateScreenshots(screenshotSettings, { Authorization: authHeader }, requestId);
    logger.info('Received response from BrowserStack', {
      requestId,
      jobId: screenshotResponse.job_id,
      screenshotCount: screenshotResponse.screenshots.length
    });

    return new Response(JSON.stringify(screenshotResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    logger.error('Error in browserstack-screenshots function', error, { requestId });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
