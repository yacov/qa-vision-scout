export interface BrowserstackCredentials {
  username: string;
  accessKey: string;
}

export interface Browser {
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
}

export interface ScreenshotInput {
  url: string;
  browsers: Browser[];
  quality?: 'compressed' | 'original';
  wait_time?: number;
  callback_url?: string;
}

export interface Screenshot {
  id: string;
  url: string;
}

export interface ScreenshotResponse {
  id: string;
  state: 'queued' | 'processing' | 'done' | 'error';
  screenshots: Screenshot[];
  callback_url?: string;
  [key: string]: unknown;
}

export interface BrowserstackError extends Error {
  statusCode: number;
  requestId: string;
  context?: Record<string, unknown>;
}