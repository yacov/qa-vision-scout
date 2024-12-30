import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { browserStackConfigSchema } from "./types";
import { supabase } from "@/integrations/supabase/client";

export const PredefinedConfigs = () => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [verifyingConfig, setVerifyingConfig] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(browserStackConfigSchema),
    defaultValues: {
      name: "",
      deviceType: "desktop",
      os: "",
      osVersion: "",
      browser: "",
      browserVersion: "",
      device: "",
    },
  });

  const { data: configs, isLoading } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

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
        .eq('id', editingConfig.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-configs'] });
      toast({
        title: "Configuration updated",
        description: "The configuration has been successfully updated.",
      });
      setEditingConfig(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyConfig = async (config: any) => {
    setVerifyingConfig(config.id);
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
    } finally {
      setVerifyingConfig(null);
    }
  };

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    form.reset({
      name: config.name,
      deviceType: config.device_type,
      os: config.os,
      osVersion: config.os_version,
      browser: config.browser || "",
      browserVersion: config.browser_version || "",
      device: config.device || "",
    });
  };

  const onSubmit = (data: any) => {
    updateConfig.mutate(data);
  };

  if (isLoading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Predefined Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {configs?.map((config) => (
              <Button
                key={config.id}
                variant={selectedConfigs.includes(config.id) ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start space-y-2 relative group"
                onClick={() => toggleConfig(config.id)}
              >
                {selectedConfigs.includes(config.id) && (
                  <Check className="h-4 w-4 absolute top-2 right-2" />
                )}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      verifyConfig(config);
                    }}
                    disabled={verifyingConfig === config.id}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(config);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="font-medium">{config.name}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {config.device_type === 'desktop' ? 'Desktop' : 'Mobile'}
                  </Badge>
                  <Badge variant="outline">
                    {config.os} {config.os_version}
                  </Badge>
                  {config.device_type === 'desktop' ? (
                    <Badge variant="outline">
                      {config.browser} {config.browser_version}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{config.device}</Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="desktop" />
                          </FormControl>
                          <FormLabel className="font-normal">Desktop</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="mobile" />
                          </FormControl>
                          <FormLabel className="font-normal">Mobile</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="os"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating System</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="osVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OS Version</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("deviceType") === "desktop" ? (
                <>
                  <FormField
                    control={form.control}
                    name="browser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Browser</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="browserVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Browser Version</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="device"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};