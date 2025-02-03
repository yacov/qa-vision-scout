import { logger } from "./utils/logger.ts";
import type { RequestData } from "./types/api-types.ts";
import { BrowserstackWaitTime, BrowserstackQuality, DeviceType } from "./types.ts";

const VALID_WAIT_TIMES: BrowserstackWaitTime[] = [2, 5, 10, 15, 20, 60];
const VALID_QUALITIES: BrowserstackQuality[] = ['compressed', 'original'];

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
    if (!config.device_type || !['desktop', 'mobile'].includes(config.device_type)) {
      throw new Error(`Invalid device type in configuration at index ${index}`);
    }
  });

  // Validate optional parameters
  if (data.wait_time !== undefined && !VALID_WAIT_TIMES.includes(data.wait_time)) {
    throw new Error('Invalid wait time. Must be one of: ' + VALID_WAIT_TIMES.join(', '));
  }

  if (data.quality !== undefined && !VALID_QUALITIES.includes(data.quality)) {
    throw new Error('Invalid quality. Must be one of: ' + VALID_QUALITIES.join(', '));
  }

  return {
    url: data.url,
    selected_configs: data.selected_configs,
    wait_time: data.wait_time,
    quality: data.quality,
    callback_url: data.callback_url,
    local: data.local
  };
}