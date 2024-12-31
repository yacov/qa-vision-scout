// Resolution constants as per API documentation
export const VALID_WIN_RESOLUTIONS = [
  '1024x768',
  '1280x800',
  '1280x1024',
  '1366x768',
  '1440x900',
  '1680x1050',
  '1600x1200',
  '1920x1200',
  '1920x1080',
  '2048x1536'
] as const;

export const VALID_MAC_RESOLUTIONS = [
  '1024x768',
  '1280x960',
  '1280x1024',
  '1600x1200',
  '1920x1080'
] as const;

export const VALID_WAIT_TIMES = [2, 5, 10, 15, 20, 60] as const;

export type WinResolution = typeof VALID_WIN_RESOLUTIONS[number];
export type MacResolution = typeof VALID_MAC_RESOLUTIONS[number];
export type WaitTime = typeof VALID_WAIT_TIMES[number];

export interface BrowserConfig {
  device_type?: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
}

export interface ScreenshotSettings {
  url: string;
  browsers: BrowserConfig[];
  quality?: 'original' | 'compressed';
  wait_time?: WaitTime;
  win_res?: WinResolution;
  mac_res?: MacResolution;
  orientation?: 'portrait' | 'landscape';
}

export interface BrowserStackResponse {
  job_id: string;
  callback_url?: string;
  win_res?: string;
  mac_res?: string;
  quality: string;
  wait_time: number;
  orientation: string;
  screenshots: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
    id: string;
    state: 'pending' | 'done' | 'error';
    url: string;
    thumb_url?: string;
    image_url?: string;
    created_at?: string;
  }>;
}

export interface BrowserStackRequestBody {
  url: string;
  browsers: BrowserConfig[];
  quality: string;
  wait_time: number;
  win_res?: string;
  mac_res?: string;
  orientation?: string;
}

export interface JobStatus {
  state: 'pending' | 'done' | 'error';
  screenshots: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
    id: string;
    state: 'pending' | 'done' | 'error';
    url: string;
    thumb_url?: string;
    image_url?: string;
    created_at?: string;
  }>;
}

export function validateResolution(res: string | undefined, validResolutions: readonly string[], type: 'Windows' | 'Mac', requestId: string): void {
  if (res && !validResolutions.includes(res)) {
    throw new Error(
      `Invalid ${type} resolution: ${res}. Valid resolutions are: ${validResolutions.join(', ')}`
    );
  }
}

export function validateWaitTime(waitTime: number | undefined, requestId: string): void {
  if (waitTime && !VALID_WAIT_TIMES.includes(waitTime as WaitTime)) {
    throw new Error(
      `Invalid wait time: ${waitTime}. Valid wait times are: ${VALID_WAIT_TIMES.join(', ')} seconds`
    );
  }
}

export type ServeFunction = (req: Request) => Promise<Response>;
export const serve: (handler: ServeFunction) => void = () => {}; 