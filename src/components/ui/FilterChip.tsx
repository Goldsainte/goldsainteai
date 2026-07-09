import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FilterChip — the one true removable-chip pattern (Airbnb-grade).
 * 32px pill, 13px label, X in a circular hover disc tight against the
 * label. Use for every removable filter/tag across the site so the
 * dismiss affordance is identical everywhere.
 */
export function FilterChip({
  children,
  onRemove,
  removeLabel = "Remove",
  icon,
  variant = "light",
  className,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel?: string;
  icon?: React.ReactNode;
  variant?: "light" | "dark";
  className?: string;
}) {
  const light = "border border-[#0a2225]/20 bg-white text-[#0a2225]";
  const dark = "border border-transparent bg-[#0a2225] text-white";
  const xLight =
    "text-[#0a2225]/60 hover:bg-[#0a2225]/8 hover:text-[#0a2225]";
  const xDark = "text-white/60 hover:bg-white/15 hover:text-white";

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full pl-3 pr-1.5 text-[13px] font-medium",
        variant === "dark" ? dark : light,
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            "mr-0.5 inline-flex shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5",
            variant === "dark" ? "text-white/60" : "text-[#0a2225]/50"
          )}
        >
          {icon}
        </span>
      )}
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
          variant === "dark" ? xDark : xLight
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
