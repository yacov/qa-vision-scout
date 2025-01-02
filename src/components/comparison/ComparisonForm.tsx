import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UrlInputs } from "./UrlInputs";
import { ConfigSelection } from "./ConfigSelection";
import { ScreenshotButton } from "./ScreenshotButton";
import { Config } from "./types";

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
  const [selectedConfigIds, setSelectedConfigIds] = useState<string[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<Config[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setBaselineUrl(initialBaselineUrl);
    setNewUrl(initialNewUrl);
  }, [initialBaselineUrl, initialNewUrl]);

  useEffect(() => {
    const fetchConfigs = async () => {
      if (selectedConfigIds.length === 0) {
        setSelectedConfigs([]);
        return;
      }

      const { data: configs, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .in('id', selectedConfigIds);

      if (error) {
        console.error("Error fetching configs:", error);
        toast({
          title: "Error",
          description: "Failed to fetch configurations",
          variant: "destructive"
        });
        return;
      }

      setSelectedConfigs(configs || []);
    };

    fetchConfigs();
  }, [selectedConfigIds, toast]);

  const toggleConfig = (configId: string) => {
    setSelectedConfigIds(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  const createTest = useMutation({
    mutationFn: async () => {
      try {
        // First create the test record
        const { data: test, error: testError } = await supabase
          .from('comparison_tests')
          .insert({
            baseline_url: baselineUrl,
            new_url: newUrl,
            user_id: '00000000-0000-0000-0000-000000000000', // This should be replaced with actual user ID
            status: 'pending'
          })
          .select()
          .single();

        if (testError) {
          console.error("Error creating test:", testError);
          throw new Error(testError.message);
        }

        if (!test) {
          throw new Error('Failed to create test record');
        }

        if (!selectedConfigs || selectedConfigs.length === 0) {
          throw new Error('No configurations found');
        }

        // Generate screenshots
        const { error: screenshotError } = await supabase.functions
          .invoke('browserstack-screenshots', {
            body: {
              testId: test.id,
              url: baselineUrl,
              selected_configs: selectedConfigs
            },
          });

        if (screenshotError) {
          console.error("Screenshot generation error:", screenshotError);
          throw new Error('Failed to generate screenshots');
        }

        return test;
      } catch (error) {
        console.error("Error in createTest:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Test created successfully",
        description: "Your comparison test has been created and is being processed."
      });
      onTestCreated();
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
    onError: (error) => {
      toast({
        title: "Error creating test",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });

  const handleScreenshotsGenerated = async (baselineUrl: string, newUrl: string, configs: Config[]) => {
    await createTest.mutateAsync();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare Websites</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UrlInputs
          baselineUrl={baselineUrl}
          newUrl={newUrl}
          onBaselineUrlChange={setBaselineUrl}
          onNewUrlChange={setNewUrl}
        />
        <ConfigSelection
          selectedConfigs={selectedConfigIds}
          onConfigToggle={toggleConfig}
        />
        <ScreenshotButton
          baselineUrl={baselineUrl}
          newUrl={newUrl}
          selectedConfigs={selectedConfigs}
          onScreenshotsGenerated={handleScreenshotsGenerated}
          disabled={createTest.isPending}
        />
      </CardContent>
    </Card>
  );
};