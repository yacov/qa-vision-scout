import { z } from "zod";

export const browserStackConfigSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  deviceType: z.enum(["desktop", "mobile"]),
  os: z.string().min(1, "Operating system is required"),
  osVersion: z.string().min(1, "OS version is required"),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  device: z.string().optional(),
});

export type BrowserStackConfigFormData = z.infer<typeof browserStackConfigSchema>;