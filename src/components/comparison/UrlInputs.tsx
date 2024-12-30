import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UrlInputsProps {
  baselineUrl: string;
  newUrl: string;
  onBaselineUrlChange: (url: string) => void;
  onNewUrlChange: (url: string) => void;
}

export const UrlInputs = ({
  baselineUrl,
  newUrl,
  onBaselineUrlChange,
  onNewUrlChange,
}: UrlInputsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="baseline">Baseline URL</Label>
        <Input
          id="baseline"
          placeholder="Enter baseline URL"
          value={baselineUrl}
          onChange={(e) => onBaselineUrlChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="new">New Version URL</Label>
        <Input
          id="new"
          placeholder="Enter new version URL"
          value={newUrl}
          onChange={(e) => onNewUrlChange(e.target.value)}
        />
      </div>
    </div>
  );
};