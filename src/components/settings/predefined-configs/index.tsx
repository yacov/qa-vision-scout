import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ConfigCard } from "./ConfigCard";
import { EditConfigDialog } from "./EditConfigDialog";
import { useConfigMutations, useConfigSelection, usePredefinedConfigs, useValidationDialog } from "./hooks";
import type { Config } from "./types";

export const PredefinedConfigs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { configs, isLoading } = usePredefinedConfigs();
  const { selectedConfigs, toggleConfig } = useConfigSelection();
  const { verifyConfig, updateConfig } = useConfigMutations();
  const { showValidationDialog } = useValidationDialog();

  const handleConfigSelect = async (config: Config) => {
    await verifyConfig(config);
    toggleConfig(config);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Predefined Configurations</CardTitle>
        <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading configurations...</p>
        ) : configs?.length ? (
          configs.map((config) => (
            <ConfigCard
              key={config.id}
              config={config}
              isSelected={selectedConfigs.some((c) => c.id === config.id)}
              onSelect={() => handleConfigSelect(config)}
              onEdit={() => showValidationDialog(config)}
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