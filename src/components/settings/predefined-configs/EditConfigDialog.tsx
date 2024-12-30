import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { browserStackConfigSchema } from "../types";
import { Button } from "@/components/ui/button";
import type { z } from "zod";

type FormData = z.infer<typeof browserStackConfigSchema>;

interface Config {
  id: string;
  name: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active?: boolean;
  created_at?: string;
  user_id?: string;
}

interface EditConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: Config | null;
  onSubmit: (data: FormData & { id: string }) => void;
}

export const EditConfigDialog = ({
  isOpen,
  onOpenChange,
  config,
  onSubmit,
}: EditConfigDialogProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(browserStackConfigSchema),
    defaultValues: {
      name: config?.name || "",
      deviceType: config?.device_type || "desktop",
      os: config?.os || "",
      osVersion: config?.os_version || "",
      browser: config?.browser || "",
      browserVersion: config?.browser_version || "",
      device: config?.device || "",
    },
  });

  const handleSubmit = (data: FormData) => {
    if (config) {
      onSubmit({ ...data, id: config.id });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 