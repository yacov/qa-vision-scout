export interface Config {
  id: string;
  name: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser?: string;
  browser_version?: string;
  device?: string;
  is_active: boolean;
  is_predefined: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ConfigMutationFn = (config: Config) => Promise<void>;
export type ConfigSelectionFn = (config: Config) => void;