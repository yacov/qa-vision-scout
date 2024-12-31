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

export interface Config {
  id: string;
  name: string;
  device_type: "desktop" | "mobile";
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active: boolean | null;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  is_predefined?: boolean;
}

export interface DatabaseConfig extends Config {}

export interface Test {
  id: string;
  baseline_url: string;
  new_url: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  created_at: string | null;
  test_screenshots: any[];
}