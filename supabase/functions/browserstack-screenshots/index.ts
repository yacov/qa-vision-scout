/// <reference types="deno" />

import { generateScreenshots as generateBrowserstackScreenshots, type ScreenshotRequest, type ScreenshotResponse, type BrowserstackCredentials } from './browserstack-api.ts';

export { type ScreenshotRequest, type ScreenshotResponse, type BrowserstackCredentials };

export async function generateScreenshots(
  request: ScreenshotRequest,
  credentials?: BrowserstackCredentials
): Promise<ScreenshotResponse> {
  return generateBrowserstackScreenshots(request, credentials);
}