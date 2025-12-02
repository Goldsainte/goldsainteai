import { MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandRegionsSectionProps {
  regions?: string[] | null;
  cities?: string[] | null;
  className?: string;
}

export function BrandRegionsSection({
  regions,
  cities,
  className,
}: BrandRegionsSectionProps) {
  const hasRegions = regions && regions.length > 0;
  const hasCities = cities && cities.length > 0;

  if (!hasRegions && !hasCities) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
        Operating Regions
      </h2>

      {hasRegions && (
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <span
              key={region}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-3 py-1.5 text-sm text-[#0a2225]"
            >
              <Globe className="h-3.5 w-3.5 text-[#7A7151]" />
              {region}
            </span>
          ))}
        </div>
      )}

      {hasCities && (
        <div className="mt-3">
          <p className="text-xs text-[#7A7151] mb-2">Key destinations</p>
          <div className="flex flex-wrap gap-1.5">
            {cities.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-2.5 py-1 text-xs text-[#4a4a4a]"
              >
                <MapPin className="h-3 w-3" />
                {city}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
