import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Config } from "./types";
import { Loader2 } from "lucide-react";

interface ScreenshotButtonProps {
  baselineUrl: string;
  newUrl: string;
  selectedConfigs: Config[];
  onScreenshotsGenerated?: (baselineUrl: string, newUrl: string, configs: any[]) => Promise<any>;
  className?: string;
  disabled?: boolean;
}

export function ScreenshotButton({
  baselineUrl,
  newUrl,
  selectedConfigs,
  onScreenshotsGenerated,
  className,
  disabled = false
}: ScreenshotButtonProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  const handleClick = async () => {
    if (!onScreenshotsGenerated || !selectedConfigs.length) return;
    
    try {
      setStatus('processing');
      // Convert configs to BrowserStack format
      const browserstackConfigs = selectedConfigs.map(config => ({
        os: config.os,
        os_version: config.os_version,
        browser: config.browser || undefined,
        browser_version: config.browser_version || undefined,
        device: config.device || undefined,
        device_type: config.device_type
      }));

      await onScreenshotsGenerated(baselineUrl, newUrl, browserstackConfigs);
      setStatus('done');
    } catch (error) {
      console.error('Failed to generate screenshots:', error);
      setStatus('idle');
    }
  };

  const buttonVariants = {
    idle: 'bg-primary hover:bg-primary/90',
    processing: 'bg-yellow-500 hover:bg-yellow-600',
    done: 'bg-green-500 hover:bg-green-600'
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || status === 'processing' || !selectedConfigs.length}
      className={cn(
        'w-full transition-colors',
        buttonVariants[status],
        className
      )}
    >
      {status === 'processing' && (
        <Loader2 data-testid="loader" className="mr-2 h-4 w-4 animate-spin" />
      )}
      {status === 'idle' && 'Start Comparison'}
      {status === 'processing' && 'Processing Screenshots'}
      {status === 'done' && 'Screenshots Ready'}
    </Button>
  );
} 