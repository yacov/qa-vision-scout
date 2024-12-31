export interface Config {
  id: string;
  name: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

export interface ValidationResponse {
  valid: boolean;
  message: string;
  configId?: string;
  suggestion?: {
    os_version?: string;
    browser_version?: string;
  };
}

export interface ValidationDialogState {
  isOpen: boolean;
  data: ValidationResponse | null;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active: boolean | null;
  created_at: string | null;
  user_id: string;
  is_predefined: boolean | null;
}