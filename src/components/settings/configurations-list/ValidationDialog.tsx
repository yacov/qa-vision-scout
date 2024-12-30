import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ValidationDialogState, ValidationResponse } from "./types";

interface ValidationDialogProps {
  dialog: ValidationDialogState;
  onClose: () => void;
  onUpdate: (suggestion: NonNullable<ValidationResponse['suggestion']>) => void;
}

export const ValidationDialog = ({
  dialog,
  onClose,
  onUpdate,
}: ValidationDialogProps) => {
  const { data } = dialog;
  if (!data || !dialog.isOpen) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {data.valid ? 'Configuration Valid' : 'Configuration Invalid'}
          </DialogTitle>
          <DialogDescription>
            {data.message}
            {data.suggestion && (
              <div className="mt-4">
                <p className="font-medium">Would you like to update to the suggested configuration?</p>
                <div className="mt-2 space-x-2">
                  <Button
                    onClick={() => onUpdate(data.suggestion!)}
                  >
                    Update Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}; 