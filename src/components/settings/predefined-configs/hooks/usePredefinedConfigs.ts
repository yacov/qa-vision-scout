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
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to match the Config type
      return (data ?? []).map(item => ({
        ...item,
        orientation: item.orientation as "portrait" | "landscape" | null,
      })) as Config[];
    }
  });

  return { configs, isLoading };
};