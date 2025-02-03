import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Edit2, Shield } from "lucide-react";
import type { Config } from "../types";

interface ConfigCardProps {
  config: Config;
  isSelected: boolean;
  onSelect: (configId: string) => void;
  onEdit: (config: Config) => void;
  onVerify: (config: Config) => void;
  isVerifying: boolean;
}

export const ConfigCard = ({
  config,
  isSelected,
  onSelect,
  onEdit,
  onVerify,
  isVerifying
}: ConfigCardProps) => {
  return (
    <Button
      key={config.id}
      className={`h-auto p-4 flex flex-col items-start space-y-2 relative ${
        isSelected ? "bg-primary text-primary-foreground" : "bg-transparent border hover:bg-accent"
      }`}
      onClick={() => onSelect(config.id)}
      aria-label={`Select configuration: ${config.name}`}
    >
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(config);
          }}
          disabled={isVerifying}
          aria-label={`Edit configuration: ${config.name}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onVerify(config);
          }}
          disabled={isVerifying}
          aria-label={`Validate configuration: ${config.name}`}
        >
          <Shield className="h-4 w-4" />
        </Button>
        {isSelected && (
          <div className="h-8 w-8 flex items-center justify-center">
            <Check className="h-4 w-4" aria-label="Configuration selected" />
          </div>
        )}
      </div>

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
  );
};