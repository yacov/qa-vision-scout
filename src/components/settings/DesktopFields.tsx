import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { BrowserStackConfigFormData } from "./types";

interface DesktopFieldsProps {
  form: UseFormReturn<BrowserStackConfigFormData>;
}

export const DesktopFields = ({ form }: DesktopFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="browser"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Browser</FormLabel>
            <FormControl>
              <Input placeholder="e.g., chrome, firefox, safari" {...field} />
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
              <Input placeholder="e.g., 121.0, latest" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};