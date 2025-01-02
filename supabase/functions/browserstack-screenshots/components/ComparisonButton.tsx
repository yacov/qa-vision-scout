import React, { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface Screenshot {
  id: string;
  image_url: string;
}

interface ComparisonButtonProps {
  baselineUrl: string;
  newVersionUrl: string;
  selectedConfigs: Array<{
    os: string;
    os_version: string;
    browser?: string;
    browser_version?: string;
    device?: string;
  }>;
  onScreenshotsGenerated?: (baselineUrl: string, newVersionUrl: string, configs: any[]) => Promise<{
    id: string;
    state: 'queued' | 'processing' | 'done';
    screenshots: Screenshot[];
  }>;
}

export function ComparisonButton({
  baselineUrl,
  newVersionUrl,
  selectedConfigs,
  onScreenshotsGenerated
}: ComparisonButtonProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [screenshots, setScreenshots] = useState<{baseline?: Screenshot; newVersion?: Screenshot}>({});

  const handleClick = async () => {
    if (!onScreenshotsGenerated) return;
    
    try {
      setStatus('processing');
      const result = await onScreenshotsGenerated(baselineUrl, newVersionUrl, selectedConfigs);
      
      if (result.state === 'done' && result.screenshots.length >= 2) {
        setScreenshots({
          baseline: result.screenshots[0],
          newVersion: result.screenshots[1]
        });
        setStatus('done');
      }
    } catch (error) {
      console.error('Failed to generate screenshots:', error);
      setStatus('idle');
    }
  };

  const buttonClasses = cn(
    'w-full py-2 px-4 rounded-md font-medium transition-colors',
    {
      'bg-blue-600 hover:bg-blue-700': status === 'idle',
      'bg-yellow-500': status === 'processing',
      'bg-green-500': status === 'done'
    }
  );

  const buttonText = {
    idle: 'Start Comparison',
    processing: 'Processing screenshots',
    done: 'Screenshots are ready'
  }[status];

  return (
    <div className="space-y-4">
      <Button 
        className={buttonClasses}
        onClick={handleClick}
        disabled={status === 'processing'}
      >
        {buttonText}
      </Button>

      {status === 'done' && screenshots.baseline && screenshots.newVersion && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <img 
              src={screenshots.baseline.image_url} 
              alt="Baseline screenshot"
              className="w-full rounded-lg shadow-lg"
            />
            <p className="mt-2 text-sm text-gray-600 text-center">Baseline Version</p>
          </div>
          <div>
            <img 
              src={screenshots.newVersion.image_url} 
              alt="New version screenshot"
              className="w-full rounded-lg shadow-lg"
            />
            <p className="mt-2 text-sm text-gray-600 text-center">New Version</p>
          </div>
        </div>
      )}
    </div>
  );
} 