import { Button } from "@/components/ui/button";
import { type Config } from "./types";

interface ScreenshotButtonProps {
  baselineUrl: string;
  newUrl: string;
  selectedConfigs: Config[];
  onScreenshotsGenerated: (baselineUrl: string, newUrl: string, configs: Config[]) => void;
  disabled?: boolean;
}

export const ScreenshotButton = ({
  baselineUrl,
  newUrl,
  selectedConfigs,
  onScreenshotsGenerated,
  disabled = false
}: ScreenshotButtonProps) => {
  const handleClick = async () => {
    if (!baselineUrl || !newUrl) {
      return;
    }
    
    await onScreenshotsGenerated(baselineUrl, newUrl, selectedConfigs);
  };

  const isDisabled = disabled || !baselineUrl || !newUrl || selectedConfigs.length === 0;

  return (
    <Button 
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full"
    >
      Generate Screenshots
    </Button>
  );
};