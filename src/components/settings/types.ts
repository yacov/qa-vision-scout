import { z } from "zod";

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
  user_id: string;
  is_predefined: boolean | null;
}

export interface Test {
  id: string;
  user_id: string;
  baseline_url: string;
  new_url: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string | null;
  updated_at: string | null;
  test_screenshots?: TestScreenshot[];
}

export interface TestScreenshot {
  id: string;
  test_id: string;
  device_name: string;
  os_version: string;
  baseline_screenshot_url: string | null;
  new_screenshot_url: string | null;
  diff_percentage: number | null;
  created_at: string | null;
}

export const browserStackConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  deviceType: z.enum(["desktop", "mobile"]),
  os: z.string().min(1, "Operating System is required"),
  osVersion: z.string().min(1, "OS Version is required"),
  browser: z.string().nullable(),
  browserVersion: z.string().nullable(),
  device: z.string().nullable(),
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

export interface EditConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: Config;
}