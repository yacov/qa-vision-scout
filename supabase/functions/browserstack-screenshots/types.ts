export interface BrowserstackCredentials {
  username: string;
  accessKey: string;
}

export type DeviceType = 'desktop' | 'mobile';

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
  selected_configs: Browser[];
  callback_url?: string;
  wait_time?: number;
  quality?: 'compressed' | 'original';
  win_res?: string;
  orientation?: 'portrait' | 'landscape';
}