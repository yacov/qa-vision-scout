export interface ScreenshotRequest {
  url: string;
  resolution: 'WINDOWS' | 'MAC';
  browsers: Array<{
    os: string;
    os_version: string;
    browser: string;
    browser_version: string;
  }>;
  waitTime: 2 | 5 | 10 | 15 | 20 | 60;
} 