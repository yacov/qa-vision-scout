import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Config, DatabaseConfig } from "../types";

const mapDatabaseConfigToConfig = (dbConfig: DatabaseConfig): Config => ({
  ...dbConfig,
  is_active: dbConfig.is_active ?? false,
  created_at: dbConfig.created_at ?? new Date().toISOString(),
});

export const usePredefinedConfigs = () => {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true })
        .returns<DatabaseConfig[]>();
      
      if (error) throw error;
      return (data ?? []).map(mapDatabaseConfigToConfig);
    }
  });

  return { configs: configs ?? [], isLoading };
};