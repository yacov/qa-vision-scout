import { useState } from "react";

export const useConfigSelection = () => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  return {
    selectedConfigs,
    toggleConfig
  };
};