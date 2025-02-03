import { z } from "zod";

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