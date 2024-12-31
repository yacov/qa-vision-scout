import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Config } from "../../types";

export const usePredefinedConfigs = () => {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true })
        .returns<Config[]>();
      
      if (error) throw error;
      return data ?? [];
    }
  });

  return { configs: configs ?? [], isLoading };
};