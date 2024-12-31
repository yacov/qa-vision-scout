import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import type { BrowserStackConfigFormData } from "./types";

export const DesktopFields = () => {
  const form = useFormContext<BrowserStackConfigFormData>();

  return (
    <>
      <FormField
        control={form.control}
        name="browser"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Browser</FormLabel>
            <FormControl>
              <Input placeholder="e.g., chrome, firefox, safari" {...field} value={field.value || ''} />
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
              <Input placeholder="e.g., 121.0, latest" {...field} value={field.value || ''} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};