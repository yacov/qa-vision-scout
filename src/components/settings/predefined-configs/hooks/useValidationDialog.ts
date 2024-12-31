import { useState } from "react";
import type { ValidationResponse, ValidationDialogState } from "../types";

export const useValidationDialog = () => {
  const [validationDialog, setValidationDialog] = useState<ValidationDialogState>({
    isOpen: false,
    data: null,
  });

  const openValidationDialog = (data: ValidationResponse) => {
    if (!data) return;
    setValidationDialog({
      isOpen: true,
      data,
    });
  };

  const closeValidationDialog = () => {
    setValidationDialog({
      isOpen: false,
      data: null,
    });
  };

  return {
    validationDialog,
    openValidationDialog,
    closeValidationDialog,
  };
};