import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidationDialog } from "./configurations-list/ValidationDialog";
import { ConfigurationsTable } from "./configurations-list/ConfigurationsTable";
import { useConfigurationsList } from "./configurations-list/useConfigurationsList";

export const ConfigurationsList = () => {
  const [validationDialog, setValidationDialog] = useState<{
    isOpen: boolean;
    data: any;
  }>({
    isOpen: false,
    data: null,
  });

  const {
    configs,
    isLoading,
    deleteConfig,
    validateConfig,
    updateConfig
  } = useConfigurationsList();

  const handleValidate = (configId: string) => {
    validateConfig.mutate(configId, {
      onSuccess: (data) => {
        setValidationDialog({
          isOpen: true,
          data,
        });
      }
    });
  };

  const handleUpdate = (suggestion: any) => {
    const configId = configs?.find((c) => c.id === validationDialog.data?.configId)?.id;
    if (!configId) return;
    
    updateConfig.mutate({
      id: configId,
      data: suggestion
    }, {
      onSuccess: () => {
        setValidationDialog({ isOpen: false, data: null });
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Saved Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigurationsTable
            configs={configs}
            isLoading={isLoading}
            onValidate={handleValidate}
            onDelete={(id) => deleteConfig.mutate(id)}
            isValidating={validateConfig.isPending}
          />
        </CardContent>
      </Card>

      <ValidationDialog
        dialog={validationDialog}
        onClose={() => setValidationDialog({ isOpen: false, data: null })}
        onUpdate={handleUpdate}
      />
    </>
  );
};