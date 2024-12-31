import { z } from "zod";
import { z } from "zod";
import type { UseMutationResult } from "@tanstack/react-query";

export type DeviceType = "desktop" | "mobile";

export const browserStackConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  device_type: z.enum(["desktop", "mobile"]),
  os: z.string().min(1, "OS is required"),
  os_version: z.string().min(1, "OS version is required"),
  browser: z.string().optional(),
  browser_version: z.string().optional(),
  device: z.string().optional(),
});

export type BrowserStackConfigFormData = z.infer<typeof browserStackConfigSchema>;

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
  is_predefined?: boolean | null;
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
