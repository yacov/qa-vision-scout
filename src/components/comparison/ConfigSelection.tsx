import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Config } from "@/components/settings/predefined-configs/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export interface ConfigSelectionProps {
  selectedConfigs: string[];
  onConfigToggle: (configId: string) => void;
}

export const ConfigSelection = ({ selectedConfigs, onConfigToggle }: ConfigSelectionProps) => {
  const { data: configs, isLoading, isError, error } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      console.log('Fetching predefined configs...');
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching configs:', error);
        throw error;
      }
      return data ?? [];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading configurations...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load configurations. Please try again later.
          {error instanceof Error && (
            <div className="mt-2 text-sm opacity-80">
              {error.message}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No predefined configurations available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      {configs.map((config) => (
        <div key={config.id} className="flex items-center space-x-2">
          <Checkbox
            id={config.id}
            checked={selectedConfigs.includes(config.id)}
            onCheckedChange={() => onConfigToggle(config.id)}
          />
          <Label 
            htmlFor={config.id} 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {config.name} - {config.device_type === 'desktop' ? 
              `${config.os} ${config.os_version} ${config.browser} ${config.browser_version}` : 
              `${config.device} ${config.os} ${config.os_version}`
            }
          </Label>
        </div>
      ))}
    </div>
  );
};