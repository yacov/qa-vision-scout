import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { BrowserStackConfigFormData } from "./types";

interface MobileFieldsProps {
  form: UseFormReturn<BrowserStackConfigFormData>;
}

export const MobileFields = ({ form }: MobileFieldsProps) => {
  return (
    <FormField
      control={form.control}
      name="device"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Device</FormLabel>
          <FormControl>
            <Input placeholder="e.g., iPhone 13, Pixel 6" {...field} value={field.value || ''} />
          </FormControl>
        </FormItem>
      )}
    />
  );
};