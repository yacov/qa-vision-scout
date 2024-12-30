import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateScreenshots } from "./browserstack-api.ts";
import { normalizeOsConfig } from "./os-config.ts";
import { validateRequestData } from "./request-validator.ts";
import { logger } from "./logger.ts";

export const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  logger.info('Received new request', { requestId, method: req.method, url: req.url });

  if (req.method === 'OPTIONS') {
    logger.info('Handling OPTIONS request', { requestId });
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
      browsers,
      wait_time: 5 as const,
      quality: "compressed" as const,
    };

    logger.info('Sending request to BrowserStack', { 
      requestId,
      url: validatedData.url,
      browserCount: browsers.length,
      settings: screenshotSettings
    });

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
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
};

serve(handler);