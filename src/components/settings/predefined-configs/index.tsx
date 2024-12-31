import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigCard } from "./ConfigCard";
import { EditConfigDialog } from "./EditConfigDialog";
import { useConfigMutations, useConfigSelection, usePredefinedConfigs, useValidationDialog } from "./hooks";
import type { Config } from "./types";

export const PredefinedConfigs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { configs, isLoading } = usePredefinedConfigs();
  const { selectedConfigs, toggleConfig } = useConfigSelection();
  const { verifyConfig, updateConfig } = useConfigMutations();
  const { openValidationDialog } = useValidationDialog();

  const handleConfigSelect = async (config: Config) => {
    const validationResult = await verifyConfig(config);
    openValidationDialog(validationResult);
    toggleConfig(config.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predefined Configurations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading configurations...</p>
        ) : configs?.length ? (
          configs.map((config) => (
            <ConfigCard
              key={config.id}
              config={config}
              isSelected={selectedConfigs.includes(config.id)}
              onSelect={() => handleConfigSelect(config)}
              onEdit={() => openValidationDialog({ valid: true, message: "", configId: config.id })}
              onUpdate={updateConfig}
            />
          ))
        ) : (
          <p>No configurations found</p>
        )}
      </CardContent>
      <EditConfigDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </Card>
  );
};