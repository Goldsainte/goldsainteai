import { cn } from "@/lib/utils";
import { Check, LucideIcon } from "lucide-react";

interface LuxurySelectionCardProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  variant?: "single" | "multi";
  className?: string;
}

export function LuxurySelectionCard({
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
  variant = "multi",
  className,
}: LuxurySelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full text-left rounded-2xl border-2 p-3 sm:p-4 transition-all duration-200",
        "hover:border-[#C7B892]/60 hover:shadow-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7B892] focus-visible:ring-offset-2",
        selected
          ? "border-[#C7B892] bg-[#F5EFE1] shadow-sm"
          : "border-[#E5DFC6] bg-white",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox/Radio indicator */}
        <div className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all",
          selected
            ? "border-[#C7B892] bg-[#C7B892]"
            : "border-[#D4CDB8] bg-white",
          variant === "single" && "rounded-full"
        )}>
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0",
                selected ? "text-[#0a2225]" : "text-[#7A7151]"
              )} />
            )}
            <span className={cn(
              "text-sm font-medium leading-tight",
              selected ? "text-[#0a2225]" : "text-[#3F3A33]"
            )}>
              {label}
            </span>
          </div>
          {description && (
            <p className={cn(
              "text-xs mt-1 leading-relaxed",
              selected ? "text-[#4A4A4A]" : "text-[#6E6650]"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
