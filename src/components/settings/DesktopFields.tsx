import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext, useWatch } from "react-hook-form";
import type { BrowserStackConfigFormData } from "./types";

export const DesktopFields = () => {
  const form = useFormContext<BrowserStackConfigFormData>();
  const os = useWatch({ control: form.control, name: "os" });
  const isWindows = os?.toLowerCase() === "windows";
  const isMac = os?.toLowerCase() === "os x";

  return (
    <>
      <FormField
        control={form.control}
        name="browser"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Browser</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., chrome, firefox, safari" 
                {...field} 
                value={field.value || ''} 
              />
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
              <Input 
                placeholder="e.g., 121.0, latest" 
                {...field} 
                value={field.value || ''} 
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isWindows && (
        <FormField
          control={form.control}
          name="win_res"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Screen Resolution</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1024x768">1024x768</SelectItem>
                  <SelectItem value="1280x1024">1280x1024</SelectItem>
                  <SelectItem value="1920x1080">1920x1080</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      )}

      {isMac && (
        <FormField
          control={form.control}
          name="mac_res"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Screen Resolution</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1024x768">1024x768</SelectItem>
                  <SelectItem value="1280x960">1280x960</SelectItem>
                  <SelectItem value="1280x1024">1280x1024</SelectItem>
                  <SelectItem value="1600x1200">1600x1200</SelectItem>
                  <SelectItem value="1920x1080">1920x1080</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      )}
    </>
  );
};