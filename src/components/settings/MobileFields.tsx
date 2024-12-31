import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import type { BrowserStackConfigFormData } from "./types";

export const MobileFields = () => {
  const form = useFormContext<BrowserStackConfigFormData>();

  return (
    <FormField
      control={form.control}
      name="device"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Device</FormLabel>
          <FormControl>
            <Input placeholder="e.g., iPhone 14, Pixel 7" {...field} value={field.value || ''} />
          </FormControl>
        </FormItem>
      )}
    />
  );
};