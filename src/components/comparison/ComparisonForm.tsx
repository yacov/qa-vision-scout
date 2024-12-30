import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        // Trigger Supabase auth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: window.location.origin + '/comparison'
          }
        });
        
        if (error) {
          console.error("Auth error:", error);
          throw new Error("Please sign in to create comparison tests");
        }
        return;
      }

      // Create the test record
      const { data: test, error: testError } = await supabase
        .from('comparison_tests')
        .insert({
          baseline_url: baselineUrl,
          new_url: newUrl,
          user_id: session.session.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (testError) {
        console.error("Error creating test:", testError);
        throw new Error(testError.message);
      }

      // Trigger screenshot generation
      const response = await fetch('/api/browserstack-screenshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({
          testId: test.id,
          baselineUrl,
          newUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Screenshot generation error:", errorData);
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
    createTest.mutate();
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