import { useState, useEffect } from "react";
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

  useEffect(() => {
    setBaselineUrl(initialBaselineUrl);
    setNewUrl(initialNewUrl);
  }, [initialBaselineUrl, initialNewUrl]);

  const createTest = useMutation({
    mutationFn: async () => {
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

      if (testError) {
        console.error("Error creating test:", testError);
        throw new Error(testError.message);
      }

      const { data: screenshotData, error: screenshotError } = await supabase.functions
        .invoke('browserstack-screenshots', {
          body: {
            testId: test.id,
            baselineUrl,
            newUrl,
            configIds: selectedConfigs,
          },
        });

      if (screenshotError) {
        console.error("Screenshot generation error:", screenshotError);
        throw new Error('Failed to generate screenshots');
      }

      return test;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-tests'] });
      toast({
        title: "Test created",
        description: "Your comparison test has been created and screenshots are being generated.",
      });
      onTestCreated();
      setBaselineUrl("");
      setNewUrl("");
      setSelectedConfigs([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create comparison test. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating test:", error);
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>URL Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <UrlInputs
          baselineUrl={baselineUrl}
          newUrl={newUrl}
          onBaselineUrlChange={setBaselineUrl}
          onNewUrlChange={setNewUrl}
        />

        <div className="space-y-4">
          <h3 className="font-semibold">Select Configurations for Comparison</h3>
          <ConfigSelection
            selectedConfigs={selectedConfigs}
            onConfigToggle={toggleConfig}
          />
        </div>

        <Button 
          onClick={handleCompare}
          disabled={createTest.isPending}
          className="w-full"
        >
          {createTest.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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