import { Check, Edit2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConfigCardProps } from "../types";

export const ConfigCard = ({
  config,
  isSelected,
  onSelect,
  onEdit,
  onUpdate
}: ConfigCardProps) => {
  return (
    <Button
      key={config.id}
      className={`h-auto p-4 flex flex-col items-start space-y-2 relative group ${
        isSelected ? "bg-primary text-primary-foreground" : "bg-transparent border hover:bg-accent"
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <Check className="h-4 w-4 absolute top-2 right-2" />
      )}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          className="h-8 w-8 bg-transparent hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          className="h-8 w-8 bg-transparent hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate();
          }}
        >
          <Shield className="h-4 w-4" />
        </Button>
      </div>
      <div className="font-medium">{config.name}</div>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-secondary text-secondary-foreground">
          {config.device_type === 'desktop' ? 'Desktop' : 'Mobile'}
        </Badge>
        <Badge className="border bg-transparent">
          {config.os} {config.os_version}
        </Badge>
        {config.device_type === 'desktop' ? (
          <Badge className="border bg-transparent">
            {config.browser} {config.browser_version}
          </Badge>
        ) : (
          <Badge className="border bg-transparent">{config.device}</Badge>
        )}
      </div>
    </Button>
  );
};