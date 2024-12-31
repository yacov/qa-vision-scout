import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Config } from "../types";

export const usePredefinedConfigs = () => {
  const { toast } = useToast();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Config[];
    }
  });

  const verifyConfig = async (config: Config) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-browserstack-config', {
        body: { config }
      });

      if (error) throw error;

      toast({
        title: data.valid ? "Configuration Valid" : "Configuration Invalid",
        description: data.message,
        variant: data.valid ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify configuration with BrowserStack",
        variant: "destructive",
      });
    }
  };

  return {
    configs,
    isLoading,
    verifyConfig
  };
};