import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface ToggleButtonGroupProps {
  options: ToggleOption[];
  value: string;
  onValueChange: (value: string) => void;
  mode?: "standard" | "icon";
  className?: string;
  ariaLabel?: string;
}

export function ToggleButtonGroup({
  options,
  value,
  onValueChange,
  mode = "standard",
  className,
  ariaLabel,
}: ToggleButtonGroupProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={onValueChange}
      className={cn(
        "flex flex-wrap gap-2",
        options.length >= 5 && "overflow-x-auto scrollbar-hide",
        className
      )}
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          variant={mode === "icon" ? "icon" : "standard"}
          size="mobile"
          className={cn(
            "whitespace-nowrap",
            mode === "icon" && "min-w-[80px]"
          )}
        >
          {option.icon && mode === "icon" && (
            <option.icon className="h-5 w-5" />
          )}
          {option.icon && mode === "standard" && (
            <option.icon className="h-4 w-4" />
          )}
          <span className={cn(mode === "icon" && "text-xs")}>{option.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
