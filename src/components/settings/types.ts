import { z } from "zod";

export type DeviceType = "desktop" | "mobile";

export interface DatabaseConfig {
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
  user_id: string;
  is_predefined: boolean | null;
}

export type Config = DatabaseConfig;

export const browserStackConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  deviceType: z.enum(["desktop", "mobile"]),
  os: z.string().min(1, "Operating System is required"),
  osVersion: z.string().min(1, "OS Version is required"),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  device: z.string().optional(),
});

export type BrowserStackConfigFormData = z.infer<typeof browserStackConfigSchema>;

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