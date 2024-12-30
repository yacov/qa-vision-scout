import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BrowserStackConfigFormData, browserStackConfigSchema } from "./types";
import { DesktopFields } from "./DesktopFields";
import { MobileFields } from "./MobileFields";

export const BrowserstackConfigForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  const form = useForm<BrowserStackConfigFormData>({
    resolver: zodResolver(browserStackConfigSchema),
    defaultValues: {
      deviceType: 'desktop'
    }
  });

  const createConfig = useMutation({
    mutationFn: async (data: BrowserStackConfigFormData) => {
      const { error } = await supabase
        .from('browserstack_configs')
        .insert({
          name: data.name,
          device_type: deviceType,
          os: data.os,
          os_version: data.osVersion,
          browser: deviceType === 'desktop' ? data.browser : null,
          browser_version: deviceType === 'desktop' ? data.browserVersion : null,
          device: deviceType === 'mobile' ? data.device : null,
          user_id: '00000000-0000-0000-0000-000000000000', // Default system user UUID
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browserstack-configs'] });
      toast({
        title: "Configuration created",
        description: "Your BrowserStack configuration has been saved.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error creating config:', error);
      toast({
        title: "Error",
        description: "Failed to create configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BrowserStackConfigFormData) => {
    createConfig.mutate({
      ...data,
      deviceType
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Windows Chrome Latest" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Device Type</FormLabel>
              <Select
                value={deviceType}
                onValueChange={(value: 'desktop' | 'mobile') => setDeviceType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            <FormField
              control={form.control}
              name="os"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operating System</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={deviceType === 'desktop' ? "e.g., Windows, OS X" : "e.g., ios, android"}
                      {...field}
                    />
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
                    <Input
                      placeholder={deviceType === 'desktop' ? "e.g., 11, Sonoma" : "e.g., 15"}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {deviceType === 'desktop' ? (
              <DesktopFields form={form} />
            ) : (
              <MobileFields form={form} />
            )}

            <Button type="submit" disabled={createConfig.isPending}>
              {createConfig.isPending ? "Creating..." : "Create Configuration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};