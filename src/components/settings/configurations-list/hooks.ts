import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { Config, ValidationResponse, ValidationDialogState } from "../types";

export const useConfigurations = () => {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['browserstack-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Config[];
    }
  });

  return { configs, isLoading };
};

export const useConfigurationMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('browserstack_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browserstack-configs'] });
      toast({
        title: "Configuration deleted",
        description: "The configuration has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive",
      });
    },
  });

  const validateConfig = useMutation({
    mutationFn: async (configId: string) => {
      const response = await fetch('/api/validate-browserstack-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate configuration');
      }
      
      return response.json() as Promise<ValidationResponse>;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to validate configuration",
        variant: "destructive",
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('browserstack_configs')
        .update({
          os_version: data.os_version,
          browser_version: data.browser_version,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browserstack-configs'] });
      toast({
        title: "Configuration updated",
        description: "The configuration has been updated with the suggested values.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  return { deleteConfig, validateConfig, updateConfig };
};

export const useValidationDialog = () => {
  const [validationDialog, setValidationDialog] = useState<ValidationDialogState>({
    isOpen: false,
    data: null,
  });

  const openValidationDialog = (data: ValidationResponse) => {
    setValidationDialog({
      isOpen: true,
      data,
    });
  };

  const closeValidationDialog = () => {
    setValidationDialog({
      isOpen: false,
      data: null,
    });
  };

  return { validationDialog, openValidationDialog, closeValidationDialog };
};