import { Activity, Footprints, Mountain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripActivityLevelBadgeProps {
  level: string;
}

const ACTIVITY_LEVELS: Record<string, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}> = {
  relaxed: {
    icon: Footprints,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    description: "These trips are designed for those who prefer a leisurely pace. Minimal physical activity is required, making them perfect for travelers who want to relax and enjoy.",
  },
  moderate: {
    icon: Activity,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "These trips involve a fair amount of activity. Expect some walking, light hikes, or city exploration. A basic level of fitness is recommended.",
  },
  adventure: {
    icon: Mountain,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: "These trips are great if you want to get moving. These itineraries may include scenic hikes and/or exercise. A moderate level of fitness is required to enjoy these trips.",
  },
  extreme: {
    icon: Zap,
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "These trips are for the physically active. Expect challenging activities like long hikes, climbing, or adventure sports. A high level of fitness is required.",
  },
};

export function TripActivityLevelBadge({ level }: TripActivityLevelBadgeProps) {
  const normalizedLevel = level.toLowerCase();
  const config = ACTIVITY_LEVELS[normalizedLevel] || ACTIVITY_LEVELS.moderate;
  const Icon = config.icon;

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", config.bgColor)}>
          <Icon className={cn("h-6 w-6", config.color)} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
            Physical Activity Level
          </p>
          <p className="font-secondary text-lg font-semibold capitalize text-[#0a2225]">
            {level}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[14px] leading-relaxed text-[#4a4a4a]">
        {config.description}
      </p>
    </section>
  );
}
