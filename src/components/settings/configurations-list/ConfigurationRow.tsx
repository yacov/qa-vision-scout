import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, CheckCircle } from "lucide-react";
import type { Config } from "../types";

interface ConfigurationRowProps {
  config: Config;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
  isValidating: boolean;
}

export const ConfigurationRow = ({
  config,
  onValidate,
  onDelete,
  isValidating,
}: ConfigurationRowProps) => {
  return (
    <TableRow key={config.id}>
      <TableCell>{config.name}</TableCell>
      <TableCell>
        <Badge className="outline">
          {config.device_type}
        </Badge>
      </TableCell>
      <TableCell>{`${config.os} ${config.os_version}`}</TableCell>
      <TableCell>
        {config.device_type === 'desktop' 
          ? `${config.browser} ${config.browser_version}`
          : config.device}
      </TableCell>
      <TableCell>
        <Badge className={config.is_active ? "default" : "secondary"}>
          {config.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="space-x-2">
        <Button
          className="bg-transparent border hover:bg-accent"
          onClick={() => onValidate(config.id)}
          disabled={isValidating}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </Button>
        <Button
          className="hover:bg-accent hover:text-accent-foreground"
          onClick={() => onDelete(config.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};