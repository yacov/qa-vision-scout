import { Browser, BrowserstackQuality, BrowserstackWaitTime } from "../types.ts";

export interface RequestData {
  url: string;
  selected_configs: Browser[];
  callback_url?: string;
  wait_time?: BrowserstackWaitTime;
  quality?: BrowserstackQuality;
  local?: boolean;
}