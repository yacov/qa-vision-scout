import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { z } from "zod";
import { browserStackConfigSchema } from "../types";

interface Config {
  id: string;
  name: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

interface DatabaseConfig {
  id: string;
  name: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active: boolean | null;
  created_at: string | null;
  user_id: string;
  is_predefined: boolean | null;
}

interface ValidationResponse {
  valid: boolean;
  message: string;
  suggestion?: {
    os_version?: string;
    browser_version?: string;
  };
}

interface ValidationDialogState {
  isOpen: boolean;
  data: ValidationResponse | null;
}

type FormData = z.infer<typeof browserStackConfigSchema>;

const mapDatabaseConfigToConfig = (dbConfig: DatabaseConfig): Config => {
  const { is_predefined, ...rest } = dbConfig;
  return {
    ...rest,
    is_active: rest.is_active ?? false,
    created_at: rest.created_at ?? new Date().toISOString(),
  };
};

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

export const useConfigMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateConfig = useMutation<void, Error, FormData & { id: string }>({
    mutationFn: async (data) => {
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

export const useConfigSelection = () => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  return { selectedConfigs, toggleConfig };
};

export const useConfigEditing = () => {
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [verifyingConfig, setVerifyingConfig] = useState<string | null>(null);

  return {
    editingConfig,
    setEditingConfig,
    verifyingConfig,
    setVerifyingConfig,
  };
};

export const useValidationDialog = () => {
  const [validationDialog, setValidationDialog] = useState<ValidationDialogState>({
    isOpen: false,
    data: null,
  });

  const openValidationDialog = (data: ValidationResponse) => {
    if (!data) return;
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