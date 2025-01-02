import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UrlInputs } from "./UrlInputs";
import { ConfigSelection } from "./ConfigSelection";

interface ComparisonFormProps {
  onTestCreated: () => void;
  initialBaselineUrl?: string;
  initialNewUrl?: string;
}

export const ComparisonForm = ({ 
  onTestCreated, 
  initialBaselineUrl = "", 
  initialNewUrl = "" 
}: ComparisonFormProps) => {
  const [baselineUrl, setBaselineUrl] = useState(initialBaselineUrl);
  const [newUrl, setNewUrl] = useState(initialNewUrl);
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  const createTest = useMutation({
    mutationFn: async () => {
      try {
        const { data: test, error: testError } = await supabase
          .from('comparison_tests')
          .insert({
            baseline_url: baselineUrl,
            new_url: newUrl,
            user_id: '00000000-0000-0000-0000-000000000000',
            status: 'pending'
          })
          .select()
          .single();

        if (testError) throw testError;
        if (!test) throw new Error('Failed to create test record');

        const { data: configs, error: configError } = await supabase
          .from('browserstack_configs')
          .select('*')
          .in('id', selectedConfigs);

        if (configError) throw new Error('Failed to fetch configurations');
        if (!configs || configs.length === 0) throw new Error('No configurations found');

        const { error: screenshotError } = await supabase.functions
          .invoke('browserstack-screenshots', {
            body: {
              testId: test.id,
              url: baselineUrl,
              selected_configs: configs
            },
          });

        if (screenshotError) throw screenshotError;
        return test;
      } catch (error) {
        console.error("Error in createTest:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-tests'] });
      toast({
        title: "Test created successfully",
        description: "Your comparison test has been created and screenshots are being generated.",
      });
      onTestCreated();
      setBaselineUrl("");
      setNewUrl("");
      setSelectedConfigs([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating test",
        description: error.message || "Failed to create comparison test. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCompare = () => {
    if (!baselineUrl || !newUrl) {
      toast({
        title: "Validation Error",
        description: "Please provide both baseline and new URLs.",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(baselineUrl);
      new URL(newUrl);
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter valid URLs for both baseline and new versions.",
        variant: "destructive",
      });
      return;
    }

    if (selectedConfigs.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one configuration for comparison.",
        variant: "destructive",
      });
      return;
    }

    createTest.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">URL Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <UrlInputs
            baselineUrl={baselineUrl}
            newUrl={newUrl}
            onBaselineUrlChange={setBaselineUrl}
            onNewUrlChange={setNewUrl}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Select Configurations for Comparison</h3>
            <p className="text-sm text-muted-foreground">Choose the device and browser configurations you want to test against.</p>
            <ConfigSelection
              selectedConfigs={selectedConfigs}
              onConfigToggle={toggleConfig}
            />
          </div>
        </div>

        <Button 
          onClick={handleCompare}
          disabled={createTest.isPending}
          className="w-full"
          aria-label={createTest.isPending ? "Creating test..." : "Start comparison"}
        >
          {createTest.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Creating Test...
            </>
          ) : (
            'Start Comparison'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};