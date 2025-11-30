import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface LuxuryFormSectionProps {
  title: string;
  subtitle?: string;
  helperText?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function LuxuryFormSection({
  title,
  subtitle,
  helperText,
  icon: Icon,
  children,
  className,
}: LuxuryFormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-6 h-6 rounded-full bg-[#F5EFE1] flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-[#7A7151]" />
            </div>
          )}
          <h3 className="text-base font-medium text-[#0a2225]">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-sm text-[#6E6650]">{subtitle}</p>
        )}
      </div>
      
      {children}
      
      {helperText && (
        <p className="text-xs text-[#9A9079] italic">{helperText}</p>
      )}
    </div>
  );
}
