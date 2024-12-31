import { logger } from "./logger";

interface RequestData {
  testId?: string;
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

export function validateRequest(requestData: RequestData): void {
  logger.info({
    message: "Validating request data",
    data: requestData
  });

  if (!requestData.url) {
    throw new Error("URL is required");
  }

  if (!requestData.selected_configs || requestData.selected_configs.length === 0) {
    throw new Error("At least one configuration must be selected");
  }

  // Validate each config
  requestData.selected_configs.forEach((config, index) => {
    if (!config.os || !config.os_version || !config.device_type) {
      throw new Error(`Invalid configuration at index ${index}`);
    }

    // Validate desktop specific fields
    if (config.device_type === 'desktop' && (!config.browser || !config.browser_version)) {
      throw new Error(`Browser and browser version are required for desktop configuration at index ${index}`);
    }

    // Validate mobile specific fields
    if (config.device_type === 'mobile' && !config.device) {
      throw new Error(`Device is required for mobile configuration at index ${index}`);
    }
  });

  logger.info({
    message: "Request validation successful",
    data: requestData
  });
}