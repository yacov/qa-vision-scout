import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditConfigDialog } from "./EditConfigDialog";
import { ConfigCard } from "./ConfigCard";
import { usePredefinedConfigs } from "./hooks/usePredefinedConfigs";
import type { Config } from "../types";

export const PredefinedConfigs = () => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [verifyingConfig, setVerifyingConfig] = useState<string | null>(null);
  
  const { configs, isLoading } = usePredefinedConfigs();

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  const handleVerify = async (config: Config) => {
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

  if (isLoading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Predefined Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {configs?.map((config) => (
              <ConfigCard
                key={config.id}
                config={config}
                isSelected={selectedConfigs.includes(config.id)}
                onSelect={toggleConfig}
                onEdit={setEditingConfig}
                onVerify={handleVerify}
                isVerifying={verifyingConfig === config.id}
              />
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