import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { ConfigurationRow } from "./ConfigurationRow";
import { ValidationDialog } from "./ValidationDialog";
import { useConfigurations, useConfigurationMutations, useValidationDialog } from "./hooks";
import type { Config } from "./types";

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (!configs || configs.length === 0) {
      return <p className="text-center text-muted-foreground">No configurations found</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Browser/Device</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config: Config) => (
            <ConfigurationRow
              key={config.id}
              config={config}
              isValidating={validateConfig.isPending}
              onValidate={handleValidate}
              onDelete={(id) => deleteConfig.mutate(id)}
            />
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Saved Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      <ValidationDialog
        dialog={validationDialog}
        onClose={closeValidationDialog}
        onUpdate={handleUpdate}
      />
    </>
  );
}; 