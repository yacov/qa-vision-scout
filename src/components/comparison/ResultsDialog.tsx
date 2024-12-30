import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResultsDialog = ({ open, onOpenChange }: ResultsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comparison Results</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Baseline Version</h3>
            <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
              Screenshot placeholder
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">New Version</h3>
            <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
              Screenshot placeholder
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};