import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Test } from "./types";

interface TestResultsTableProps {
  onTestSelect?: (baselineUrl: string, newUrl: string) => void;
}

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'in_progress':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export const TestResultsTable = ({ onTestSelect }: TestResultsTableProps) => {
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['comparison-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comparison_tests')
        .select('*, test_screenshots(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Test[];
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Tests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto" role="region" aria-label="Test results table">
          {testsLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading test results" />
            </div>
          ) : tests?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-2/5">Baseline URL</TableHead>
                  <TableHead scope="col" className="w-2/5">New URL</TableHead>
                  <TableHead scope="col" className="w-1/5">Status</TableHead>
                  <TableHead scope="col" className="w-1/5">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow 
                    key={test.id}
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onTestSelect?.(test.baseline_url, test.new_url)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Test comparison between ${test.baseline_url} and ${test.new_url}`}
                  >
                    <TableCell className="truncate max-w-xs" title={test.baseline_url}>
                      {test.baseline_url}
                    </TableCell>
                    <TableCell className="truncate max-w-xs" title={test.new_url}>
                      {test.new_url}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(test.status || '')}>
                        {test.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(test.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tests found</p>
              <p className="text-sm mt-2">Start by creating a new comparison test above.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};