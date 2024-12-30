import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateScreenshots } from "./browserstack-api.ts";
import { normalizeOsConfig } from "./os-config.ts";

// Logger utility for consistent log format
const logger = {
  info: (message: string, context: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },
  error: (message: string, error: unknown, context: Record<string, unknown> = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      ...context
    }));
  },
  warn: (message: string, context: Record<string, unknown> = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  }
};

interface BrowserstackConfig {
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

interface BrowserstackBrowser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

function transformConfig(config: BrowserstackConfig): BrowserstackBrowser {
  const browserConfig: BrowserstackBrowser = {
    os: config.os,
    os_version: config.os_version
  };

  if (config.device_type === 'mobile') {
    if (!config.device) {
      throw new Error('Device name is required for mobile configurations');
    }
    browserConfig.device = config.device;
  } else {
    if (!config.browser || !config.browser_version) {
      throw new Error('Browser and browser version are required for desktop configurations');
    }
    browserConfig.browser = config.browser.toLowerCase();
    browserConfig.browser_version = config.browser_version.toLowerCase() === 'latest' ? 'latest' : config.browser_version;
  }

  return browserConfig;
}

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
    logger.info('Parsed request data', { 
      requestId,
      url: requestData.url,
      configCount: requestData.selected_configs?.length,
      configs: requestData.selected_configs?.map((c: BrowserstackConfig) => ({
        device_type: c.device_type,
        os: c.os,
        os_version: c.os_version,
        browser: c.browser,
        device: c.device
      }))
    });

    // Validate required parameters
    const { url, selected_configs } = requestData;
    if (!url) {
      logger.warn('Missing URL parameter', { requestId });
      throw new Error('Missing required parameter: url');
    }
    if (!selected_configs) {
      logger.warn('Missing selected_configs parameter', { requestId });
      throw new Error('Missing required parameter: selected_configs');
    }
    if (!Array.isArray(selected_configs) || selected_configs.length === 0) {
      logger.warn('Invalid selected_configs format', { 
        requestId,
        isArray: Array.isArray(selected_configs),
        length: selected_configs?.length 
      });
      throw new Error('Invalid parameter: selected_configs must be a non-empty array of browser configurations');
    }

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json'
    };

    const browsers = selected_configs.map((config: BrowserstackConfig, index: number) => {
      logger.info('Processing browser configuration', { 
        requestId,
        configIndex: index,
        deviceType: config.device_type,
        os: config.os,
        osVersion: config.os_version
      });

      // Validate device_type
      if (!config.device_type || !['desktop', 'mobile'].includes(config.device_type)) {
        logger.warn('Invalid device type', { 
          requestId,
          configIndex: index,
          deviceType: config.device_type 
        });
        throw new Error('Invalid device_type: must be either "desktop" or "mobile"');
      }

      if (!config.os || !config.os_version || !config.device_type) {
        logger.warn('Missing required fields', { 
          requestId,
          configIndex: index,
          hasOs: !!config.os,
          hasOsVersion: !!config.os_version,
          hasDeviceType: !!config.device_type
        });
        throw new Error('Invalid browser configuration: missing required fields (os, os_version, device_type)');
      }

      const normalizedConfig = normalizeOsConfig(config);
      logger.info('Normalized OS config', { 
        requestId,
        configIndex: index,
        originalOs: config.os,
        normalizedOs: normalizedConfig.os,
        originalVersion: config.os_version,
        normalizedVersion: normalizedConfig.os_version
      });

      return transformConfig({
        ...config,
        os: normalizedConfig.os,
        os_version: normalizedConfig.os_version
      });
    });

    const screenshotSettings = {
      url,
      browsers,
      wait_time: 5 as const,
      quality: "compressed" as const,
    };

    logger.info('Sending request to BrowserStack', { 
      requestId,
      url,
      browserCount: browsers.length,
      settings: screenshotSettings
    });

    const screenshotResponse = await generateScreenshots(screenshotSettings, { Authorization: authHeader }, requestId);
    logger.info('Received response from BrowserStack', { 
      requestId,
      jobId: screenshotResponse.job_id,
      screenshotCount: screenshotResponse.screenshots.length,
      status: screenshotResponse.screenshots.map(s => ({ id: s.id, state: s.state }))
    });

    return new Response(JSON.stringify(screenshotResponse), {
      headers: responseHeaders,
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