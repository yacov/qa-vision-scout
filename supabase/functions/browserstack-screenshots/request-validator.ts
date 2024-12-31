import { logger } from "./logger";

interface RequestData {
  url?: string;
  selected_configs?: Array<{
    device_type: 'desktop' | 'mobile';
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
  }>;
}

export function validateRequestData(data: RequestData, requestId: string) {
  logger.info({
    message: 'Validating request data',
    requestId,
    hasUrl: !!data.url,
    hasConfigs: !!data.selected_configs,
    configCount: data.selected_configs?.length
  });

  if (!data.url) {
    logger.warn({
      message: 'Missing URL parameter',
      requestId
    });
    throw new Error('Missing required parameter: url');
  }

  if (!data.selected_configs || !Array.isArray(data.selected_configs) || data.selected_configs.length === 0) {
    logger.warn({
      message: 'Invalid or missing selected_configs',
      requestId,
      hasConfigs: !!data.selected_configs,
      isArray: Array.isArray(data.selected_configs),
      length: data.selected_configs?.length
    });
    throw new Error('Missing required parameter: selected_configs must be a non-empty array');
  }

  data.selected_configs.forEach((config, index) => {
    if (!config.device_type || !['desktop', 'mobile'].includes(config.device_type)) {
      logger.warn({
        message: 'Invalid device type',
        requestId,
        configIndex: index,
        deviceType: config.device_type
      });
      throw new Error('Invalid device_type: must be either "desktop" or "mobile"');
    }

    if (!config.os || !config.os_version) {
      logger.warn({
        message: 'Missing OS information',
        requestId,
        configIndex: index,
        hasOs: !!config.os,
        hasOsVersion: !!config.os_version
      });
      throw new Error('Missing required OS information');
    }

    if (config.device_type === 'desktop' && (!config.browser || !config.browser_version)) {
      logger.warn({
        message: 'Missing browser information for desktop',
        requestId,
        configIndex: index,
        hasBrowser: !!config.browser,
        hasBrowserVersion: !!config.browser_version
      });
      throw new Error('Browser and browser version are required for desktop configurations');
    }

    if (config.device_type === 'mobile' && !config.device) {
      logger.warn({
        message: 'Missing device for mobile',
        requestId,
        configIndex: index
      });
      throw new Error('Device name is required for mobile configurations');
    }
  });

  return data;
}