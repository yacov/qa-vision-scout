import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Config } from "../../types";

export const useConfigMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateConfig = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('browserstack_configs')
        .update({
          name: data.name,
          device_type: data.deviceType,
          os: data.os,
          os_version: data.osVersion,
          browser: data.deviceType === 'desktop' ? data.browser : null,
          browser_version: data.deviceType === 'desktop' ? data.browserVersion : null,
          device: data.deviceType === 'mobile' ? data.device : null,
        })
        .eq('id', data.id);

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

  const verifyConfig = async (config: Config) => {
    try {
      const { data: response, error } = await supabase.functions.invoke<{
        valid: boolean;
        message: string;
        suggestion?: {
          os_version?: string;
          browser_version?: string;
        };
      }>('validate-browserstack-config', {
        body: { config }
      });

      if (error) throw error;
      if (!response) throw new Error('No response from validation');

      toast({
        title: response.valid ? "Configuration Valid" : "Configuration Invalid",
        description: response.message,
        variant: response.valid ? "default" : "destructive",
      });

      return response;
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify configuration with BrowserStack",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { updateConfig, verifyConfig };
};