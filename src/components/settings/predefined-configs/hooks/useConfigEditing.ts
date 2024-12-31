import { useState } from "react";
import type { Config } from "../types";

export const useConfigEditing = () => {
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [verifyingConfig, setVerifyingConfig] = useState<string | null>(null);

  return {
    editingConfig,
    setEditingConfig,
    verifyingConfig,
    setVerifyingConfig,
  };
};