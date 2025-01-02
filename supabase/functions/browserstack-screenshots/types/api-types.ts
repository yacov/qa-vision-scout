export interface BrowserstackCredentials {
  username: string;
  password: string;
}

export interface Browser {
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

export interface ScreenshotRequest {
  url: string;
  browsers: Browser[];
  quality?: 'compressed' | 'original';
  wait_time?: number;
  callback_url?: string;
  orientation?: 'portrait' | 'landscape';
  mac_res?: string;
  win_res?: string;
  local?: boolean;
}

export interface Screenshot {
  id: string;
  browser: string;
  browser_version: string | null;
  os: string;
  os_version: string;
  url: string;
  state: 'done' | 'processing' | 'error';
  image_url: string | null;
  thumb_url: string | null;
  device: string | null;
  orientation: 'portrait' | 'landscape';
  created_at: string;
}

export interface ScreenshotResponse {
  id: string;
  state: 'done' | 'queued_all' | 'error';
  callback_url: string | null;
  win_res: string;
  mac_res: string;
  quality: 'compressed' | 'original';
  wait_time: number;
  orientation: 'portrait' | 'landscape';
  screenshots: Screenshot[];
  stopped: boolean;
}