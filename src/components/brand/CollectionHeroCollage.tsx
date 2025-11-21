import { cn } from "@/lib/utils";

interface CollectionHeroCollageProps {
  mainImageUrl: string;
  secondaryImageUrl?: string | null;
  tertiaryImageUrl?: string | null;
  title: string;
  className?: string;
}

export function CollectionHeroCollage({
  mainImageUrl,
  secondaryImageUrl,
  tertiaryImageUrl,
  title,
  className,
}: CollectionHeroCollageProps) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]", className)}>
      {/* Main large image */}
      <div className="overflow-hidden rounded-[28px] bg-[#D8CFBD]/40 shadow-[0_18px_40px_rgba(10,34,37,0.18)]">
        <img
          src={mainImageUrl}
          alt={title}
          className="h-full w-full max-h-[420px] object-cover"
        />
      </div>

      {/* Secondary and tertiary images stacked */}
      <div className="space-y-3">
        {secondaryImageUrl ? (
          <div className="overflow-hidden rounded-[24px] shadow-[0_16px_36px_rgba(10,34,37,0.15)]">
            <img
              src={secondaryImageUrl}
              alt=""
              className="h-40 w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center overflow-hidden rounded-[24px] bg-[#F5F0E0] text-xs text-[#8C8470]">
            Image coming soon
          </div>
        )}

        {tertiaryImageUrl ? (
          <div className="overflow-hidden rounded-[24px] shadow-[0_16px_36px_rgba(10,34,37,0.15)]">
            <img
              src={tertiaryImageUrl}
              alt=""
              className="h-40 w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center overflow-hidden rounded-[24px] bg-[#F5F0E0] text-xs text-[#8C8470]">
            Image coming soon
          </div>
        )}
      </div>
    </div>
  );
}
