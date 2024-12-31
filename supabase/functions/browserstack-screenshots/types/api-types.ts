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
}

export interface Screenshot {
  id: string;
  url: string;
  thumb_url: string;
  image_url: string;
  state: string;
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  created_at: string;
}

export interface ScreenshotResponse {
  job_id: string;
  state: string;
  callback_url: string | null;
  quality: 'compressed' | 'original';
  wait_time: number;
  screenshots: Screenshot[];
}

export interface BrowsersResponse {
  browsers: Browser[];
}