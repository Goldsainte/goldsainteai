import { cn } from "@/lib/utils";

interface TripSummaryChipsProps {
  duration?: string;
  season?: string;
  style?: string;
  budgetBand?: string;
  pace?: string;
  className?: string;
}

export function TripSummaryChips({
  duration,
  season,
  style,
  budgetBand,
  pace,
  className,
}: TripSummaryChipsProps) {
  const chips = [duration, season, style, budgetBand, pace].filter(Boolean);

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A4987C]">
        Trip blueprint
      </h3>
      <div className="flex flex-wrap gap-2 text-[11px] text-[#574E3D]">
        {chips.map((chip, idx) => (
          <span
            key={idx}
            className="rounded-full bg-[#F5EFE1] px-3 py-1.5"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
