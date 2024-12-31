import { type Config } from "@/components/settings/predefined-configs/types";

export interface ConfigSelectionProps {
  selectedConfigs: string[];
  onConfigToggle: (configId: string) => void;
}

export const ConfigSelection = ({ selectedConfigs, onConfigToggle }: ConfigSelectionProps) => {
  const handleToggle = (configId: string) => {
    onConfigToggle(configId);
  };

  return (
    <div className="grid gap-4">
      {selectedConfigs.map((configId) => (
        <div key={configId} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedConfigs.includes(configId)}
            onChange={() => handleToggle(configId)}
          />
          <label className="ml-2">{configId}</label>
        </div>
      ))}
    </div>
  );
};
