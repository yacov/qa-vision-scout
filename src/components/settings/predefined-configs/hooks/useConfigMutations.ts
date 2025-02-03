import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Config } from "../../types";

export const useConfigMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const verifyConfig = useMutation({
    mutationFn: async (config: Config) => {
      console.log('Verifying config:', config);
      const { data, error } = await supabase.functions.invoke('validate-browserstack-config', {
        body: { config }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: data.valid ? "Configuration Valid" : "Configuration Invalid",
        description: data.message,
        variant: data.valid ? "default" : "destructive",
      });
    },
    onError: (error) => {
      console.error('Verification error:', error);
      toast({
        title: "Verification Error",
        description: "Failed to verify configuration with BrowserStack",
        variant: "destructive",
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (config: Config) => {
      const { error } = await supabase
        .from('browserstack_configs')
        .update({
          name: config.name,
          device_type: config.device_type,
          os: config.os,
          os_version: config.os_version,
          browser: config.device_type === 'desktop' ? config.browser : null,
          browser_version: config.device_type === 'desktop' ? config.browser_version : null,
          device: config.device_type === 'mobile' ? config.device : null,
        })
        .eq('id', config.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-configs'] });
      toast({
        title: "Configuration updated",
        description: "The configuration has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    verifyConfig,
    updateConfig
  };
};