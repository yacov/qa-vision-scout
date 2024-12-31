import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Config, ValidationResponse, ValidationDialogState } from "../types";

export const useConfigurations = () => {
  const { data: configs, isLoading } = useQuery<Config[], Error>({
    queryKey: ['browserstack-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ?? [];
    }
  });

  return { configs, isLoading };
};

export const useConfigurationMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteConfig = useMutation<void, Error, string>({
    mutationFn: async (id) => {
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

  const validateConfig = useMutation<ValidationResponse, Error, string>({
    mutationFn: async (configId) => {
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
      
      return response.json();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to validate configuration",
        variant: "destructive",
      });
    },
  });

  const updateConfig = useMutation<
    void,
    Error,
    { id: string; data: { os_version?: string; browser_version?: string } }
  >({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('browserstack_configs')
        .update(data)
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

  return {
    validationDialog,
    openValidationDialog,
    closeValidationDialog,
  };
};