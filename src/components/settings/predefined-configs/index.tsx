import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigCard } from "./ConfigCard";
import { EditConfigDialog } from "./EditConfigDialog";
import {
  usePredefinedConfigs,
  useConfigMutations,
  useConfigSelection,
  useConfigEditing,
} from "./hooks";

export const PredefinedConfigs = () => {
  const { configs, isLoading } = usePredefinedConfigs();
  const { updateConfig, verifyConfig } = useConfigMutations();
  const { selectedConfigs, toggleConfig } = useConfigSelection();
  const {
    editingConfig,
    setEditingConfig,
    verifyingConfig,
    setVerifyingConfig,
  } = useConfigEditing();

  const handleVerify = async (config: any) => {
    setVerifyingConfig(config.id);
    try {
      await verifyConfig(config);
    } finally {
      setVerifyingConfig(null);
    }
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
  };

  const handleSubmit = (data: any) => {
    updateConfig.mutate({
      ...data,
      id: editingConfig?.id,
    });
    setEditingConfig(null);
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
                isVerifying={verifyingConfig === config.id}
                onToggle={toggleConfig}
                onVerify={handleVerify}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <EditConfigDialog
        isOpen={!!editingConfig}
        onOpenChange={(open) => !open && setEditingConfig(null)}
        config={editingConfig}
        onSubmit={handleSubmit}
      />
    </>
  );
}; 