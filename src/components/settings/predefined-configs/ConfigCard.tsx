import { Check, Edit2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Config {
  id: string;
  name: string;
  device_type: 'desktop' | 'mobile';
  os: string;
  os_version: string;
  browser: string | null;
  browser_version: string | null;
  device: string | null;
  is_active?: boolean;
  created_at?: string;
  user_id?: string;
}

interface ConfigCardProps {
  config: Config;
  isSelected: boolean;
  isVerifying: boolean;
  onToggle: (id: string) => void;
  onVerify: (config: Config) => void;
  onEdit: (config: Config) => void;
}

export const ConfigCard = ({
  config,
  isSelected,
  isVerifying,
  onToggle,
  onVerify,
  onEdit,
}: ConfigCardProps) => {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="h-auto p-4 flex flex-col items-start space-y-2 relative group"
      onClick={() => onToggle(config.id)}
    >
      {isSelected && (
        <Check className="h-4 w-4 absolute top-2 right-2" />
      )}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onVerify(config);
          }}
          disabled={isVerifying}
        >
          <Shield className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(config);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
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
          config.browser && config.browser_version && (
            <Badge variant="outline">
              {config.browser} {config.browser_version}
            </Badge>
          )
        ) : (
          config.device && <Badge variant="outline">{config.device}</Badge>
        )}
      </div>
    </Button>
  );
}; 