import { logger } from "./utils/logger.ts";
import type { RequestData } from "./types/api-types.ts";

export function validateRequestData(data: any, requestId: string): RequestData {
  logger.info({
    message: 'Validating request data',
    requestId,
    data
  });

  if (!data.url) {
    throw new Error('URL is required');
  }

  if (!data.selected_configs || !Array.isArray(data.selected_configs)) {
    throw new Error('Selected configurations are required and must be an array');
  }

  if (data.selected_configs.length === 0) {
    throw new Error('At least one configuration must be selected');
  }

  // Validate each config
  data.selected_configs.forEach((config: any, index: number) => {
    if (!config.os || typeof config.os !== 'string') {
      throw new Error(`Invalid OS in configuration at index ${index}`);
    }
    if (!config.os_version || typeof config.os_version !== 'string') {
      throw new Error(`Invalid OS version in configuration at index ${index}`);
    }
  });

  return {
    url: data.url,
    selected_configs: data.selected_configs
  };
}