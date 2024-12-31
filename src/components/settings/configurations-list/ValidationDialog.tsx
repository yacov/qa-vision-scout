import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ValidationDialogState } from "../types";

interface ValidationDialogProps {
  dialog: ValidationDialogState;
  onClose: () => void;
  onUpdate: (suggestion: { os_version?: string; browser_version?: string }) => void;
}

export const ValidationDialog = ({ dialog, onClose, onUpdate }: ValidationDialogProps) => {
  return (
    <Dialog open={dialog.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dialog.data?.valid ? 'Configuration Valid' : 'Configuration Invalid'}
          </DialogTitle>
          <DialogDescription>
            {dialog.data?.message}
            {dialog.data?.suggestion && (
              <div className="mt-4">
                <p className="font-medium">Would you like to update to the suggested configuration?</p>
                <div className="mt-2 space-x-2">
                  <Button onClick={() => onUpdate(dialog.data?.suggestion || {})}>
                    Update Configuration
                  </Button>
                  <Button
                    className="bg-transparent border hover:bg-accent"
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