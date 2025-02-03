import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormContext } from "react-hook-form";
import type { BrowserStackConfigFormData } from "./types";

export const MobileFields = () => {
  const form = useFormContext<BrowserStackConfigFormData>();

  return (
    <>
      <FormField
        control={form.control}
        name="device"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Device</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., iPhone 15, Pixel 7" 
                {...field} 
                value={field.value || ''} 
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="orientation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Screen Orientation</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value || 'portrait'}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="portrait" />
                  </FormControl>
                  <FormLabel className="font-normal">Portrait</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="landscape" />
                  </FormControl>
                  <FormLabel className="font-normal">Landscape</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};