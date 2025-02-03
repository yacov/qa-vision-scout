export interface BrowserstackCredentials {
  username: string;
  accessKey: string;
}

export type DeviceType = 'desktop' | 'mobile';
export type BrowserstackQuality = 'compressed' | 'original';
export type BrowserstackOrientation = 'portrait' | 'landscape';
export type BrowserstackWaitTime = 2 | 5 | 10 | 15 | 20 | 60;

export interface Browser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
  device_type: DeviceType;
  win_res?: string;
  mac_res?: string;
  orientation?: BrowserstackOrientation;
}

export interface ScreenshotInput {
  url: string;
  selected_configs: Browser[];
  callback_url?: string;
  wait_time?: BrowserstackWaitTime;
  quality?: BrowserstackQuality;
  local?: boolean;
}