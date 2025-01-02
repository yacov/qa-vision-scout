import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Config } from "./types";
import { Loader2 } from "lucide-react";

interface ScreenshotButtonProps {
  baselineUrl: string;
  newUrl: string;
  selectedConfigs: Config[];
  onScreenshotsGenerated: (baselineUrl: string, newUrl: string, configs: Config[]) => Promise<void>;
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
    if (!baselineUrl || !newUrl || !selectedConfigs.length) {
      return;
    }
    
    try {
      setStatus('processing');
      await onScreenshotsGenerated(baselineUrl, newUrl, selectedConfigs);
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

  const isDisabled = disabled || status === 'processing' || !baselineUrl || !newUrl || selectedConfigs.length === 0;

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'w-full transition-colors',
        buttonVariants[status],
        className
      )}
    >
      {status === 'processing' && (
        <Loader2 data-testid="loader" className="mr-2 h-4 w-4 animate-spin" />
      )}
      {status === 'idle' && 'Generate Screenshots'}
      {status === 'processing' && 'Processing Screenshots'}
      {status === 'done' && 'Screenshots Ready'}
    </Button>
  );
}