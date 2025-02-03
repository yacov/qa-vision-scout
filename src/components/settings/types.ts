import { z } from "zod";

export type DeviceType = "desktop" | "mobile";

const resolutionSchema = {
  desktop: z.object({
    win_res: z.enum(["1024x768", "1280x1024", "1920x1080"]).optional(),
    mac_res: z.enum(["1024x768", "1280x960", "1280x1024", "1600x1200", "1920x1080"]).optional(),
  }),
  mobile: z.object({
    orientation: z.enum(["portrait", "landscape"]).optional(),
  }),
};

export const browserStackConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  deviceType: z.enum(["desktop", "mobile"]),
  os: z.string().min(1, "Operating System is required"),
  osVersion: z.string().min(1, "OS Version is required"),
  browser: z.string().nullable(),
  browserVersion: z.string().nullable(),
  device: z.string().nullable(),
  ...resolutionSchema.desktop,
  ...resolutionSchema.mobile,
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
  orientation?: "portrait" | "landscape";
  win_res?: "1024x768" | "1280x1024" | "1920x1080";
  mac_res?: "1024x768" | "1280x960" | "1280x1024" | "1600x1200" | "1920x1080";
  is_active: boolean;
  created_at: string | null;
  user_id: string;
  is_predefined: boolean | null;
}