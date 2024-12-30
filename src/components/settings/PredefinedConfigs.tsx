import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const PredefinedConfigs = () => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);

  const { data: configs, isLoading } = useQuery({
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

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  if (isLoading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Predefined Configurations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {configs?.map((config) => (
            <Button
              key={config.id}
              variant={selectedConfigs.includes(config.id) ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start space-y-2 relative"
              onClick={() => toggleConfig(config.id)}
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
      </CardContent>
    </Card>
  );
};