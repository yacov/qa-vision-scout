import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationsTable } from "./ConfigurationsTable";
import { ValidationDialog } from "./ValidationDialog";
import { useConfigurations, useConfigurationMutations, useValidationDialog } from "./hooks";

export const ConfigurationsList = () => {
  const { configs, isLoading } = useConfigurations();
  const { deleteConfig, validateConfig, updateConfig } = useConfigurationMutations();
  const { validationDialog, openValidationDialog, closeValidationDialog } = useValidationDialog();

  const handleValidate = async (configId: string) => {
    const result = await validateConfig.mutateAsync(configId);
    openValidationDialog({ ...result, configId });
  };

  const handleUpdate = (suggestion: { os_version?: string; browser_version?: string }) => {
    if (!validationDialog.data?.configId) return;
    
    updateConfig.mutate({
      id: validationDialog.data.configId,
      data: suggestion
    });
    closeValidationDialog();
  };

  return (
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

      <ValidationDialog
        dialog={validationDialog}
        onClose={closeValidationDialog}
        onUpdate={handleUpdate}
      />
    </Card>
  );
};