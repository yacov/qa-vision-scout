import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigCard } from "./ConfigCard";
import { EditConfigDialog } from "./EditConfigDialog";
import { useConfigMutations, useConfigSelection, usePredefinedConfigs } from "./hooks";
import type { Config } from "../types";

export const PredefinedConfigs = () => {
  const [editingConfig, setEditingConfig] = useState<Config | undefined>(undefined);
  const { configs, isLoading } = usePredefinedConfigs();
  const { selectedConfigs, toggleConfig } = useConfigSelection();
  const { verifyConfig, updateConfig } = useConfigMutations();

  const handleConfigSelect = async (config: Config) => {
    toggleConfig(config.id);
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
            <ConfigCard
              key={config.id}
              config={config}
              isSelected={selectedConfigs.includes(config.id)}
              onSelect={() => handleConfigSelect(config)}
              onEdit={() => setEditingConfig(config)}
              onVerify={() => verifyConfig.mutate(config)}
              isVerifying={verifyConfig.isPending}
            />
          ))}
        </div>
      </CardContent>

      <EditConfigDialog
        open={!!editingConfig}
        onOpenChange={(open) => !open && setEditingConfig(undefined)}
        config={editingConfig}
      />
    </Card>
  );
};