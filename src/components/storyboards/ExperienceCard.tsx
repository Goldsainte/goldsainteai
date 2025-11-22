type ExperienceCardProps = {
  dayNumber?: number;
  timeOfDay?: string;
  caption: string;
  locationLabel?: string;
  categoryTag?: string;
};

export function ExperienceCard({
  dayNumber,
  timeOfDay,
  caption,
  locationLabel,
  categoryTag,
}: ExperienceCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Day & Time Header */}
      {(dayNumber || timeOfDay) && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          {dayNumber && <span className="font-semibold">Day {dayNumber}</span>}
          {timeOfDay && <span>· {timeOfDay}</span>}
        </div>
      )}
      
      {/* Title */}
      <h3 className="mb-1 font-semibold text-foreground">{caption}</h3>
      
      {/* Location & Category */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {locationLabel && (
          <span className="rounded-full bg-muted px-2 py-1">
            📍 {locationLabel}
          </span>
        )}
        {categoryTag && (
          <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">
            {categoryTag}
          </span>
        )}
      </div>
    </div>
  );
}
