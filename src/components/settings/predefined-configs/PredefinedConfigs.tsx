import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditConfigDialog } from "./EditConfigDialog";
import { ConfigCard } from "./ConfigCard";
import { usePredefinedConfigs } from "./hooks/usePredefinedConfigs";
import { useConfigMutations } from "./hooks/useConfigMutations";
import { useToast } from "@/hooks/use-toast";
import type { Config } from "../types";

export const PredefinedConfigs = () => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [verifyingConfig, setVerifyingConfig] = useState<string | null>(null);
  
  const { configs, isLoading } = usePredefinedConfigs();
  const { verifyConfig } = useConfigMutations();
  const { toast } = useToast();

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
      const result = await verifyConfig.mutateAsync(config);
      toast({
        title: result.valid ? "Configuration Valid" : "Configuration Invalid",
        description: result.message,
        variant: result.valid ? "default" : "destructive",
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