// Resolution constants as per API documentation
export const VALID_RESOLUTIONS = {
  WINDOWS: ['1024x768', '1280x1024', '1920x1080'] as const,
  MAC: ['1024x768', '1280x960', '1280x1024', '1600x1200', '1920x1080'] as const
} as const;

export const VALID_WAIT_TIMES = [2, 5, 10, 15, 20, 60] as const;

export type WaitTime = typeof VALID_WAIT_TIMES[number];
export type ResolutionType = keyof typeof VALID_RESOLUTIONS;
export type WindowsResolution = typeof VALID_RESOLUTIONS.WINDOWS[number];
export type MacResolution = typeof VALID_RESOLUTIONS.MAC[number];

// Default resolutions for each platform
export const DEFAULT_RESOLUTIONS: Record<ResolutionType, string> = {
  WINDOWS: '1024x768',
  MAC: '1024x768'
};

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
  win_res?: WindowsResolution;
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
  quality: 'compressed' | 'original';
  wait_time: WaitTime;
  win_res?: WindowsResolution;
  mac_res?: MacResolution;
  orientation?: 'portrait' | 'landscape';
  callback_url?: string;
  local?: boolean;
}

export interface JobStatus {
  id: string;
  state: 'queued' | 'processing' | 'done' | 'error';
  message?: string;
  screenshots: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
    id: string;
    state: 'queued' | 'processing' | 'done' | 'error';
    url: string;
    thumb_url?: string;
    image_url?: string;
    created_at?: string;
  }>;
}

export function getResolutionForType(type: ResolutionType): string {
  return DEFAULT_RESOLUTIONS[type];
}

export function validateResolution(res: string | undefined, type: 'Windows' | 'Mac'): void {
  if (!res) return;
  
  const validResolutions = type === 'Windows' ? VALID_RESOLUTIONS.WINDOWS : VALID_RESOLUTIONS.MAC;
  
  if (!validResolutions.includes(res as any)) {
    throw new Error(
      `Invalid ${type} resolution: ${res}. Valid resolutions are: ${validResolutions.join(', ')}`
    );
  }
}

export function validateWaitTime(waitTime: number | undefined): void {
  if (!waitTime) return;
  
  if (!VALID_WAIT_TIMES.includes(waitTime as WaitTime)) {
    throw new Error(
      `Invalid wait time: ${waitTime}. Valid wait times are: ${VALID_WAIT_TIMES.join(', ')} seconds`
    );
  }
}

export type ServeFunction = (req: Request) => Promise<Response>;
export const serve: (handler: ServeFunction) => void = () => {}; 