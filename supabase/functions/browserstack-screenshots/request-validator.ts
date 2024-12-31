import { logger } from "./logger.ts";

interface RequestData {
  testId?: string;
  url?: string;
  selected_configs?: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
  }>;
}

export function validateRequestData(data: unknown, requestId: string): RequestData {
  logger.info({
    message: 'Validating request data',
    requestId,
    data
  });

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request data: must be an object');
  }

  const requestData = data as RequestData;

  if (!requestData.testId) {
    throw new Error('Missing required field: testId');
  }

  if (!requestData.url) {
    throw new Error('Missing required field: url');
  }

  try {
    new URL(requestData.url);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!Array.isArray(requestData.selected_configs) || requestData.selected_configs.length === 0) {
    throw new Error('Missing or empty selected_configs array');
  }

  // Validate each config
  requestData.selected_configs.forEach((config, index) => {
    if (!config.os) {
      throw new Error(`Missing required field: os in config at index ${index}`);
    }
    if (!config.os_version) {
      throw new Error(`Missing required field: os_version in config at index ${index}`);
    }
  });

  logger.info({
    message: 'Request data validated successfully',
    requestId,
    testId: requestData.testId,
    configCount: requestData.selected_configs.length
  });

  return requestData;
}