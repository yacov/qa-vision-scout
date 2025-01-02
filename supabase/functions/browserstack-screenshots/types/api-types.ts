export interface BrowserstackCredentials {
  username: string;
  accessKey: string;
}

export type DeviceType = 'desktop' | 'mobile';

export type Quality = 'original' | 'compressed';

export type WaitTime = 2 | 5 | 10 | 15 | 20 | 60;

export type WindowsResolution = '1024x768' | '1280x800' | '1280x1024' | '1366x768' | '1440x900' | '1680x1050' | '1920x1080' | '1920x1200' | '2048x1536';

export type Orientation = 'portrait' | 'landscape';

export interface Browser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
  device_type?: DeviceType;
}

export interface ScreenshotInput {
  url: string;
  browsers: Browser[];
  callback_url?: string;
  wait_time?: WaitTime;
  quality?: Quality;
  win_res?: WindowsResolution;
  orientation?: Orientation;
}

export interface Screenshot {
  id: string;
  state: 'queued' | 'processing' | 'done';
  browser?: string;
  browser_version?: string;
  os?: string;
  os_version?: string;
  device?: string;
  url?: string;
}

export interface ScreenshotResponse {
  id: string;
  job_id: string;
  state: 'queued' | 'processing' | 'done';
  callback_url: string | null;
  screenshots: Screenshot[];
}

export interface BrowserstackError extends Error {
  statusCode: number;
  requestId: string;
  context?: Record<string, unknown>;
}