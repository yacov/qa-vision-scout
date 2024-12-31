import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge, type BadgeProps } from "@/components/ui/badge";

interface Test {
  id: string;
  baseline_url: string;
  new_url: string;
  status: string;
  created_at: string;
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

interface TestResultsTableProps {
  onTestSelect?: (baselineUrl: string, newUrl: string) => void;
}

export const TestResultsTable = ({ onTestSelect }: TestResultsTableProps) => {
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['comparison-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comparison_tests')
        .select('*, test_screenshots(*)')
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
              {tests.map((test: Test) => (
                <TableRow 
                  key={test.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => onTestSelect?.(test.baseline_url, test.new_url)}
                >
                  <TableCell className="truncate max-w-xs">{test.baseline_url}</TableCell>
                  <TableCell className="truncate max-w-xs">{test.new_url}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeVariant(test.status || 'unknown')}>
                      {test.status}
                    </Badge>
                  </TableCell>
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