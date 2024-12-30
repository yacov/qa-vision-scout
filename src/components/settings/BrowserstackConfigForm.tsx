import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { browserStackConfigSchema, BrowserStackConfigFormData } from "./types";
import { DesktopFields } from "./DesktopFields";
import { MobileFields } from "./MobileFields";

export const BrowserstackConfigForm = () => {
  const [deviceType, setDeviceType] = useState<"desktop" | "mobile">("desktop");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BrowserStackConfigFormData>({
    resolver: zodResolver(browserStackConfigSchema),
    defaultValues: {
      deviceType: "desktop",
      name: "",
      os: "",
      osVersion: "",
      browser: "",
      browserVersion: "",
      device: "",
    },
  });

  const createConfig = useMutation({
    mutationFn: async (data: BrowserStackConfigFormData) => {
      const { error } = await supabase.from("browserstack_configs").insert({
        name: data.name,
        device_type: data.deviceType,
        os: data.os,
        os_version: data.osVersion,
        browser: data.deviceType === "desktop" ? data.browser : null,
        browser_version: data.deviceType === "desktop" ? data.browserVersion : null,
        device: data.deviceType === "mobile" ? data.device : null,
        user_id: "00000000-0000-0000-0000-000000000000", // Default system user UUID
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browserstack-configs"] });
      queryClient.invalidateQueries({ queryKey: ["predefined-configs"] });
      toast({
        title: "Configuration created",
        description: "Your BrowserStack configuration has been saved.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create configuration. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating configuration:", error);
    },
  });

  const onSubmit = (data: BrowserStackConfigFormData) => {
    createConfig.mutate(data);
  };

  return (
    <Card>
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
                    <Input placeholder="e.g., Chrome Latest Windows" {...field} />
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
                      onValueChange={(value: "desktop" | "mobile") => {
                        field.onChange(value);
                        setDeviceType(value);
                      }}
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
                    <Input
                      placeholder={
                        deviceType === "desktop"
                          ? "e.g., Windows, OS X"
                          : "e.g., ios, android"
                      }
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
                      placeholder={
                        deviceType === "desktop"
                          ? "e.g., 11, Ventura"
                          : "e.g., 14, 13"
                      }
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {deviceType === "desktop" ? (
              <DesktopFields form={form} />
            ) : (
              <MobileFields form={form} />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={createConfig.isPending}
            >
              {createConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Configuration"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};