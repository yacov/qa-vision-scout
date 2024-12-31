import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { browserStackConfigSchema } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { Config } from "../types";
import { DesktopFields } from "../DesktopFields";
import { MobileFields } from "../MobileFields";

interface EditConfigFormProps {
  config?: Config;
  onOpenChange: (open: boolean) => void;
}

export const EditConfigForm = ({ config, onOpenChange }: EditConfigFormProps) => {
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

  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        deviceType: config.device_type,
        os: config.os,
        osVersion: config.os_version,
        browser: config.browser || "",
        browserVersion: config.browser_version || "",
        device: config.device || "",
      });
    }
  }, [config, form.reset]);

  const onSubmit = async (data: any) => {
    try {
      if (!config?.id) return;

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
        .eq('id', config.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['predefined-configs'] });
      toast({
        title: "Configuration updated",
        description: "The configuration has been successfully updated.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
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
          <DesktopFields />
        ) : (
          <MobileFields />
        )}

        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Form>
  );
};