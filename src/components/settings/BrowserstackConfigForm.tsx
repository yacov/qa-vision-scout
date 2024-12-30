import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ConfigFormData {
  name: string;
  deviceType: 'desktop' | 'mobile';
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  device?: string;
}

export const BrowserstackConfigForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ConfigFormData>();

  const createConfig = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      const { error } = await supabase
        .from('browserstack_configs')
        .insert({
          name: data.name,
          device_type: data.deviceType,
          os: data.os,
          os_version: data.osVersion,
          browser: data.deviceType === 'desktop' ? data.browser : null,
          browser_version: data.deviceType === 'desktop' ? data.browserVersion : null,
          device: data.deviceType === 'mobile' ? data.device : null,
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
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    createConfig.mutate(data);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="e.g., Windows Chrome Latest"
            />
          </div>

          <div>
            <Label htmlFor="deviceType">Device Type</Label>
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
          </div>

          <div>
            <Label htmlFor="os">Operating System</Label>
            <Input
              id="os"
              {...register("os", { required: true })}
              placeholder={deviceType === 'desktop' ? "e.g., Windows, OS X" : "e.g., ios, android"}
            />
          </div>

          <div>
            <Label htmlFor="osVersion">OS Version</Label>
            <Input
              id="osVersion"
              {...register("osVersion", { required: true })}
              placeholder={deviceType === 'desktop' ? "e.g., 11, Sonoma" : "e.g., 15"}
            />
          </div>

          {deviceType === 'desktop' ? (
            <>
              <div>
                <Label htmlFor="browser">Browser</Label>
                <Input
                  id="browser"
                  {...register("browser", { required: deviceType === 'desktop' })}
                  placeholder="e.g., chrome, firefox, safari"
                />
              </div>

              <div>
                <Label htmlFor="browserVersion">Browser Version</Label>
                <Input
                  id="browserVersion"
                  {...register("browserVersion", { required: deviceType === 'desktop' })}
                  placeholder="e.g., 121.0, latest"
                />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="device">Device</Label>
              <Input
                id="device"
                {...register("device", { required: deviceType === 'mobile' })}
                placeholder="e.g., iPhone 13, Pixel 6"
              />
            </div>
          )}

          <Button type="submit" disabled={createConfig.isPending}>
            {createConfig.isPending ? "Creating..." : "Create Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};