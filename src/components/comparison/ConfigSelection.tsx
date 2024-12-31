import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Config } from "@/components/settings/predefined-configs/types";

interface ConfigSelectionProps {
  onConfigSelect: (configs: string[]) => void;
}

export const ConfigSelection = ({ onConfigSelect }: ConfigSelectionProps) => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data, error } = await supabase
        .from("browserstack_configs")
        .select("*")
        .eq("is_active", true);

      if (!error && data) {
        setConfigs(data as Config[]);
      }
      setLoading(false);
    };

    void fetchConfigs();
  }, []);

  const handleConfigToggle = (config: Config) => {
    const newSelectedConfigs = selectedConfigs.includes(config.id)
      ? selectedConfigs.filter((id) => id !== config.id)
      : [...selectedConfigs, config.id];

    setSelectedConfigs(newSelectedConfigs);
    onConfigSelect(newSelectedConfigs);
  };

  if (loading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Configurations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {configs.map((config) => (
            <Button
              key={config.id}
              variant={selectedConfigs.includes(config.id) ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => handleConfigToggle(config)}
            >
              <div className="font-medium">{config.name}</div>
              <div className="text-sm text-gray-500">
                {config.os} {config.os_version}
              </div>
              {config.browser && (
                <div className="text-sm text-gray-500">
                  {config.browser} {config.browser_version}
                </div>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};