import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ComparisonFormProps {
  onTestCreated: () => void;
}

export const ComparisonForm = ({ onTestCreated }: ComparisonFormProps) => {
  const [baselineUrl, setBaselineUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTest = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create the test record
      const { data: test, error: testError } = await supabase
        .from('comparison_tests')
        .insert({
          baseline_url: baselineUrl,
          new_url: newUrl,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (testError) throw testError;

      // Trigger screenshot generation
      const response = await fetch('/api/browserstack-screenshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          testId: test.id,
          baselineUrl,
          newUrl,
        }),
      });

      if (!response.ok) {
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create comparison test. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating test:", error);
    }
  });

  const handleCompare = () => {
    if (baselineUrl && newUrl) {
      createTest.mutate();
    } else {
      toast({
        title: "Validation Error",
        description: "Please provide both baseline and new URLs.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>URL Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <Button 
          onClick={handleCompare}
          disabled={createTest.isPending}
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