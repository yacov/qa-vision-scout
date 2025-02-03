import { z } from "zod";

const baseSchema = {
  name: z.string().min(1, "Name is required"),
  deviceType: z.enum(["desktop", "mobile"]),
  os: z.string().min(1, "Operating System is required"),
  osVersion: z.string().min(1, "OS Version is required"),
  browser: z.string().nullable(),
  browserVersion: z.string().nullable(),
  device: z.string().nullable(),
};

const desktopSchema = {
  win_res: z.enum(["1024x768", "1280x1024", "1920x1080"]).optional(),
  mac_res: z.enum(["1024x768", "1280x960", "1280x1024", "1600x1200", "1920x1080"]).optional(),
};

const mobileSchema = {
  orientation: z.enum(["portrait", "landscape"]).optional(),
};

export const browserStackConfigSchema = z.object({
  ...baseSchema,
  ...desktopSchema,
  ...mobileSchema,
});

export type BrowserStackConfigFormData = z.infer<typeof browserStackConfigSchema>;