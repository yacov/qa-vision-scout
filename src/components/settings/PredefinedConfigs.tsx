import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Edit2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EditConfigDialog } from "./predefined-configs/EditConfigDialog";
import type { Config } from "./types";

export const PredefinedConfigs = () => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [verifyingConfig, setVerifyingConfig] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Config[];
    }
  });

  const verifyConfig = async (config: any) => {
    setVerifyingConfig(config.id);
    try {
      const { data, error } = await supabase.functions.invoke('validate-browserstack-config', {
        body: { config }
      });

      if (error) throw error;

      toast({
        title: data.valid ? "Configuration Valid" : "Configuration Invalid",
        description: data.message,
        variant: data.valid ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify configuration with BrowserStack",
        variant: "destructive",
      });
    } finally {
      setVerifyingConfig(null);
    }
  };

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Predefined Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {configs?.map((config: Config) => (
              <Button
                key={config.id}
                className={`h-auto p-4 flex flex-col items-start space-y-2 relative group ${
                  selectedConfigs.includes(config.id) ? "bg-primary text-primary-foreground" : "bg-transparent border hover:bg-accent"
                }`}
                onClick={() => toggleConfig(config.id)}
              >
                {selectedConfigs.includes(config.id) && (
                  <Check className="h-4 w-4 absolute top-2 right-2" />
                )}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    className="h-8 w-8 bg-transparent hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingConfig(config);
                    }}
                    disabled={verifyingConfig === config.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    className="h-8 w-8 bg-transparent hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      verifyConfig(config);
                    }}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
                <div className="font-medium">{config.name}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-secondary text-secondary-foreground">
                    {config.device_type === 'desktop' ? 'Desktop' : 'Mobile'}
                  </Badge>
                  <Badge className="border bg-transparent">
                    {config.os} {config.os_version}
                  </Badge>
                  {config.device_type === 'desktop' ? (
                    <Badge className="border bg-transparent">
                      {config.browser || ''} {config.browser_version || ''}
                    </Badge>
                  ) : (
                    <Badge className="border bg-transparent">{config.device || ''}</Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditConfigDialog 
        open={!!editingConfig} 
        onOpenChange={(open: boolean) => !open && setEditingConfig(null)}
        config={editingConfig || undefined}
      />
    </>
  );
};
