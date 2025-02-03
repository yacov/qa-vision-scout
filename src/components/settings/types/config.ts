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
  orientation: "portrait" | "landscape" | null;
  win_res: string | null;
  mac_res: string | null;
  is_active: boolean | null;
  created_at: string | null;
  user_id: string;
  is_predefined: boolean | null;
}

export interface EditConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: Config;
}