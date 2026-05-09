import { useNavigate } from "react-router-dom";
import { Star, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface BrandSummary {
  profile_id: string;
  name: string;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  bio?: string | null;
  brand_type?: string | null;
  categories?: string[] | null;
  regions?: string[] | null;
  supplier_type?: string | null;
  supplier_rating?: number | null;
  supplier_reviews?: number | null;
  match_score?: number | null;
}

interface BrandCardProps {
  brand: BrandSummary;
}

export function BrandCard({ brand }: BrandCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Fire-and-forget tracking - log profile_view event
    void supabase.rpc("log_brand_engagement", {
      p_brand_profile_id: brand.profile_id,
      p_event_type: "profile_view",
      p_context_type: "marketplace",
      p_context_id: null,
      p_metadata: {},
    });

    navigate(`/brands/${brand.profile_id}`);
  };

  // Format brand type for display
  const formatBrandType = (type: string | null | undefined) => {
    if (!type) return null;
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <button
      onClick={handleClick}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DFC6]/60 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Cover image section */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6]">
        {brand.cover_image_url ? (
          <img
            src={brand.cover_image_url}
            alt={`${brand.name} cover`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"/>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-10 w-10 text-[#BFAD72]/50" />
          </div>
        )}
        {/* Brand type badge */}
        {brand.brand_type && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#0a2225] shadow-sm backdrop-blur-sm">
            {formatBrandType(brand.brand_type)}
          </span>
        )}
      </div>

      {/* Header with avatar and name */}
      <div className="flex items-center gap-3 border-b border-[#E5DFC6]/40 px-4 py-3">
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-[#F5F0E0] shadow-sm -mt-8 relative z-10">
          {brand.avatar_url ? (
            <img
              src={brand.avatar_url}
              alt={brand.name}
              className="h-full w-full object-cover"
            loading="lazy"/>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#0a2225]">
              {brand.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-[#0a2225] truncate">
            {brand.name}
          </h3>
          {brand.supplier_type && !brand.brand_type && (
            <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">
              {brand.supplier_type}
            </p>
          )}
        </div>
        {brand.supplier_rating && (
          <div className="flex items-center gap-1 text-sm text-[#0a2225]">
            <Star className="h-4 w-4 fill-[#BFAD72] text-[#BFAD72]" />
            <span>{brand.supplier_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 px-4 py-3">
        {brand.bio && (
          <p className="line-clamp-3 text-xs leading-relaxed text-[#4a4a4a]">
            {brand.bio}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {brand.regions && brand.regions.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-2 py-1 text-[#4a4a4a]">
              <MapPin className="h-3 w-3 text-[#BFAD72]" />
              {brand.regions.slice(0, 2).join(" • ")}
            </span>
          )}
          {brand.categories?.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-[#E5DFC6] px-2 py-1 text-[11px] uppercase tracking-wide text-[#7A7151]"
            >
              {cat}
            </span>
          ))}
          {brand.match_score !== undefined && brand.match_score > 0 && (
            <span className="ml-auto rounded-full bg-[#0a2225] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#E5DFC6]">
              Match {Math.round((brand.match_score ?? 0) * 10)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
