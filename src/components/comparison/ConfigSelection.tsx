import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Config } from "@/components/settings/predefined-configs/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ConfigSelectionProps {
  selectedConfigs: string[];
  onConfigToggle: (configId: string) => void;
}

export const ConfigSelection = ({ selectedConfigs, onConfigToggle }: ConfigSelectionProps) => {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data ?? [];
    }
  });

  if (isLoading) {
    return <div>Loading configurations...</div>;
  }

  if (!configs || configs.length === 0) {
    return <div>No predefined configurations available.</div>;
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
          <Label htmlFor={config.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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