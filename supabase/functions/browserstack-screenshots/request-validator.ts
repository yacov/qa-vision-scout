import { logger } from "./logger.ts";
import type { RequestData } from "./types/api-types.ts";

export function validateRequestData(data: any, requestId: string): RequestData {
  logger.debug({
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

  return {
    url: data.url,
    selected_configs: data.selected_configs
  };
}
