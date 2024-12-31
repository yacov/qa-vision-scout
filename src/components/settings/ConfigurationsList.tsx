import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ValidationDialog } from "./configurations-list/ValidationDialog";
import type { Config } from "./types";

export const ConfigurationsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [validationDialog, setValidationDialog] = useState<{
    isOpen: boolean;
    data: any;
  }>({
    isOpen: false,
    data: null,
  });

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
      
      return response.json();
    },
    onSuccess: (data) => {
      setValidationDialog({
        isOpen: true,
        data,
      });
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
      setValidationDialog({ isOpen: false, data: null });
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Saved Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : configs?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Browser/Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config: Config) => (
                  <TableRow key={config.id}>
                    <TableCell>{config.name}</TableCell>
                    <TableCell>
                      <Badge className="outline">
                        {config.device_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{`${config.os} ${config.os_version}`}</TableCell>
                    <TableCell>
                      {config.device_type === 'desktop' 
                        ? `${config.browser || ''} ${config.browser_version || ''}`
                        : config.device || ''}
                    </TableCell>
                    <TableCell>
                      <Badge className={config.is_active ? "default" : "secondary"}>
                        {config.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        className="bg-transparent border hover:bg-accent"
                        onClick={() => validateConfig.mutate(config.id)}
                        disabled={validateConfig.isPending}
                      >
                        {validateConfig.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        className="hover:bg-accent hover:text-accent-foreground"
                        onClick={() => deleteConfig.mutate(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">No configurations found</p>
          )}
        </CardContent>
      </Card>

      <ValidationDialog
        dialog={validationDialog}
        onClose={() => setValidationDialog({ isOpen: false, data: null })}
        onUpdate={(suggestion) => {
          const configId = configs?.find((c) => c.id === validationDialog.data?.configId)?.id;
          if (!configId) return;
          updateConfig.mutate({
            id: configId,
            data: suggestion
          });
        }}
      />
    </>
  );
};
