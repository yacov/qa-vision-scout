export interface RequestData {
  url: string;
  selected_configs: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
  }>;
}