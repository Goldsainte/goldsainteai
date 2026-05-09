import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type BrandCollectionCardProps = {
  brandId: string;
  collectionId: string;
  title: string;
  subtitle?: string;
  coverMainImageUrl: string;
  coverSecondaryImageUrl?: string;
  coverTertiaryImageUrl?: string;
  tags?: string[];
  savedCount?: number;
  startingPriceLabel?: string; // e.g. "From $4,200 pp"
};

export const BrandCollectionCard: React.FC<BrandCollectionCardProps> = ({
  brandId,
  collectionId,
  title,
  subtitle,
  coverMainImageUrl,
  coverSecondaryImageUrl,
  coverTertiaryImageUrl,
  tags = [],
  savedCount,
  startingPriceLabel,
}) => {
  return (
    <Link
      to={`/brands/${brandId}/collections/${collectionId}`}
      className="block h-full"
    >
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E5DFC6] bg-[#FDFBF5]/95",
          "shadow-[0_18px_40px_rgba(10,34,37,0.08)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_rgba(10,34,37,0.16)]"
        )}
      >
        {/* Collage */}
        <div className="space-y-2 p-2 pb-0">
          <div className="overflow-hidden rounded-[20px]">
            <img
              src={coverMainImageUrl}
              alt={title}
              className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"/>
          </div>
          {(coverSecondaryImageUrl || coverTertiaryImageUrl) && (
            <div className="grid grid-cols-2 gap-2">
              {coverSecondaryImageUrl && (
                <div className="overflow-hidden rounded-[16px]">
                  <img
                    src={coverSecondaryImageUrl}
                    alt=""
                    className="h-20 w-full object-cover"
                  loading="lazy"/>
                </div>
              )}
              {coverTertiaryImageUrl && (
                <div className="overflow-hidden rounded-[16px]">
                  <img
                    src={coverTertiaryImageUrl}
                    alt=""
                    className="h-20 w-full object-cover"
                  loading="lazy"/>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 px-4 py-4">
          <div>
            <h3 className="text-sm font-semibold text-[#0a2225]">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-[12px] text-[#7A7151]">{subtitle}</p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#E0D6C0] bg-white/80 px-2 py-[2px] text-[11px] text-[#6C6251]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between text-[11px] text-[#6E6654]">
            <div className="flex items-center gap-2">
              {savedCount !== undefined && savedCount > 0 && (
                <span>Saved {savedCount}×</span>
              )}
            </div>
            {startingPriceLabel && (
              <span className="font-medium text-[#0a2225]">
                {startingPriceLabel}
              </span>
            )}
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center text-[12px] font-medium text-[#0a2225] group-hover:underline">
              View collection
              <span className="ml-1 text-xs">↗</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};
