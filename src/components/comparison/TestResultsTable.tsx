import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TestResultsTable = () => {
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['comparison-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comparison_tests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tests</CardTitle>
      </CardHeader>
      <CardContent>
        {testsLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : tests?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Baseline URL</TableHead>
                <TableHead>New URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="truncate max-w-xs">{test.baseline_url}</TableCell>
                  <TableCell className="truncate max-w-xs">{test.new_url}</TableCell>
                  <TableCell>{test.status}</TableCell>
                  <TableCell>{new Date(test.created_at || '').toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground">No tests found</p>
        )}
      </CardContent>
    </Card>
  );
};