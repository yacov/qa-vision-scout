import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { ConfigurationRow } from "./ConfigurationRow";
import type { Config } from "../types";

interface ConfigurationsTableProps {
  configs: Config[] | undefined;
  isLoading: boolean;
  onValidate: (configId: string) => void;
  onDelete: (configId: string) => void;
  isValidating: boolean;
}

export const ConfigurationsTable = ({
  configs,
  isLoading,
  onValidate,
  onDelete,
  isValidating
}: ConfigurationsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!configs?.length) {
    return <p className="text-center text-muted-foreground">No configurations found</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>OS</TableHead>
          <TableHead>Browser/Device</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs.map((config) => (
          <ConfigurationRow
            key={config.id}
            config={config}
            onValidate={onValidate}
            onDelete={onDelete}
            isValidating={isValidating}
          />
        ))}
      </TableBody>
    </Table>
  );
};