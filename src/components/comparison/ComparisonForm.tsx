import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

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

  // Fetch predefined configurations
  const { data: configs } = useQuery({
    queryKey: ['predefined-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('browserstack_configs')
        .select('*')
        .eq('is_predefined', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Update form values when initial values change
  useEffect(() => {
    setBaselineUrl(initialBaselineUrl);
    setNewUrl(initialNewUrl);
  }, [initialBaselineUrl, initialNewUrl]);

  const createTest = useMutation({
    mutationFn: async () => {
      // Create the test record with a default user ID
      const { data: test, error: testError } = await supabase
        .from('comparison_tests')
        .insert({
          baseline_url: baselineUrl,
          new_url: newUrl,
          user_id: '00000000-0000-0000-0000-000000000000', // Default system user UUID
          status: 'pending'
        })
        .select()
        .single();

      if (testError) {
        console.error("Error creating test:", testError);
        throw new Error(testError.message);
      }

      // Trigger screenshot generation using Supabase Edge Function
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

  const toggleConfig = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

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
        <div className="space-y-4">
          <div>
            <Label htmlFor="baseline">Baseline URL</Label>
            <Input
              id="baseline"
              placeholder="Enter baseline URL"
              value={baselineUrl}
              onChange={(e) => setBaselineUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new">New Version URL</Label>
            <Input
              id="new"
              placeholder="Enter new version URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Select Configurations for Comparison</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs?.map((config) => (
              <Button
                key={config.id}
                variant={selectedConfigs.includes(config.id) ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start space-y-2 relative"
                onClick={() => toggleConfig(config.id)}
              >
                {selectedConfigs.includes(config.id) && (
                  <Check className="h-4 w-4 absolute top-2 right-2" />
                )}
                <div className="font-medium">{config.name}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {config.device_type === 'desktop' ? 'Desktop' : 'Mobile'}
                  </Badge>
                  <Badge variant="outline">
                    {config.os} {config.os_version}
                  </Badge>
                  {config.device_type === 'desktop' ? (
                    <Badge variant="outline">
                      {config.browser} {config.browser_version}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{config.device}</Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
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