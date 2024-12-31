import { z } from "zod";

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

// Base configuration type that matches database schema
export interface DatabaseConfig {
  id: string;
  name: string;
  device_type: "desktop" | "mobile";
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  is_predefined?: boolean | null;
}

// Frontend Config type that matches database schema
export type Config = DatabaseConfig;

export interface Test {
  id: string;
  baseline_url: string;
  new_url: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  created_at: string | null;
  test_screenshots: any[];
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
  config: DatabaseConfig;
  isSelected: boolean;
  onEdit: () => void;
  onSelect: () => void | Promise<void>;
  onUpdate: any; // Using any here since it's a mutation result type
}