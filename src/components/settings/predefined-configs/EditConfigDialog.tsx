import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditConfigForm } from "./EditConfigForm";
import type { EditConfigDialogProps } from "../types";

export const EditConfigDialog = ({
  open,
  onOpenChange,
  config
}: EditConfigDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
        </DialogHeader>
        <EditConfigForm config={config} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};