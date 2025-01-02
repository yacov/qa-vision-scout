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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // First create the test record
        const { data: test, error: testError } = await supabase
          .from('comparison_tests')
          .insert({
            baseline_url: baselineUrl,
            new_url: newUrl,
            status: 'pending',
            user_id: user.id
          })
          .select()
          .single();

        if (testError) throw testError;
        if (!test) throw new Error('Failed to create test record');

        // Generate screenshots for baseline URL
        const { error: screenshotError } = await supabase.functions
          .invoke('browserstack-screenshots', {
            body: {
              url: baselineUrl,
              selected_configs: selectedConfigs
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

  const handleScreenshotsGenerated = async () => {
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