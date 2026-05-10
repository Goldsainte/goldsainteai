interface TripActivityLevelBadgeProps {
  level: string;
}

const ACTIVITY_LEVELS: Record<string, {
  color: string;
  description: string;
}> = {
  relaxed: {
    color: "bg-emerald-500",
    description: "These trips are designed for those who prefer a leisurely pace. Minimal physical activity is required, making them perfect for travelers who want to relax and enjoy.",
  },
  moderate: {
    color: "bg-[#0c4d47]",
    description: "These trips involve a fair amount of activity. Expect some walking, light hikes, or city exploration. A basic level of fitness is recommended.",
  },
  adventure: {
    color: "bg-amber-500",
    description: "These trips are great if you want to get moving. These itineraries may include scenic hikes and/or exercise. A moderate level of fitness is required to enjoy these trips.",
  },
  extreme: {
    color: "bg-red-500",
    description: "These trips are for the physically active. Expect challenging activities like long hikes, climbing, or adventure sports. A high level of fitness is required.",
  },
};

export function TripActivityLevelBadge({ level }: TripActivityLevelBadgeProps) {
  const normalizedLevel = level.toLowerCase();
  const config = ACTIVITY_LEVELS[normalizedLevel] || ACTIVITY_LEVELS.moderate;

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
        Physical Activity Level
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${config.color}`} />
        <p className="font-secondary text-lg font-semibold capitalize text-[#0a2225]">
          {level}
        </p>
      </div>

      <p className="mt-4 text-[14px] leading-relaxed text-[#4a4a4a]">
        {config.description}
      </p>
    </section>
  );
}
