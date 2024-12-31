import type { UseMutationResult } from "@tanstack/react-query";

export type DeviceType = "desktop" | "mobile";

export interface Config {
  id: string;
  name: string;
  device_type: DeviceType;
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  is_predefined: boolean | null;
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

export interface ConfigCardProps {
  config: Config;
  isSelected: boolean;
  onEdit: () => void;
  onSelect: () => void | Promise<void>;
  onUpdate: UseMutationResult<void, Error, any, unknown>;
}

export interface EditConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: Config;
}