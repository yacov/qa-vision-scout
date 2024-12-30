import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ConfigSelectionProps {
  selectedConfigs: string[];
  onConfigToggle: (configId: string) => void;
}

export const ConfigSelection = ({
  selectedConfigs,
  onConfigToggle,
}: ConfigSelectionProps) => {
  const { data: configs } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs?.map((config) => (
          <Button
            key={config.id}
            variant={selectedConfigs.includes(config.id) ? "default" : "outline"}
            className="h-auto p-4 flex flex-col items-start space-y-2 relative"
            onClick={() => onConfigToggle(config.id)}
          >
            {selectedConfigs.includes(config.id) && (
              <Check className="h-4 w-4 absolute top-2 right-2" />
            )}
            <div className="font-medium">{config.name}</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {config.device_type === 'desktop' ? 'Desktop' : 'Mobile'}
              </Badge>
              <Badge variant="outline">
                {config.os} {config.os_version}
              </Badge>
              {config.device_type === 'desktop' ? (
                <Badge variant="outline">
                  {config.browser} {config.browser_version}
                </Badge>
              ) : (
                <Badge variant="outline">{config.device}</Badge>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};