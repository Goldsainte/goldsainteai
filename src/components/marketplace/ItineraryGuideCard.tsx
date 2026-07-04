import { Link } from "react-router-dom";
import { MapPin, Clock, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShareButton } from "@/components/ShareButton";
import { TripCoverImage } from "@/components/marketplace/TripCoverImage";

interface Guide {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  price: number;
  currency: string;
  cover_image_url: string | null;
  description: string | null;
  created_at?: string | null;
  view_count?: number | null;
  creator: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export function ItineraryGuideCard({ guide }: { guide: Guide }) {
  const priceLabel = `${guide.currency === "USD" ? "$" : ""}${Number(guide.price).toFixed(0)}`;
  const creatorName = guide.creator?.full_name || guide.creator?.username || "Creator";

  return (
    <Link
      to={`/itinerary-guide/${guide.id}`}
      className="group block overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F0E8]">
        <TripCoverImage
          src={guide.cover_image_url}
          alt={guide.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#0c4d47] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#E5DFC6]">
          <Download className="h-3 w-3" />
          Digital Guide
        </div>
        {(() => {
          const ageMs = guide.created_at ? Date.now() - new Date(guide.created_at).getTime() : Infinity;
          const within14d = ageMs < 14 * 24 * 60 * 60 * 1000;
          const within30d = ageMs < 30 * 24 * 60 * 60 * 1000;
          const trending = within30d && (guide.view_count ?? 0) > 100;
          const label = trending ? "Trending" : within14d ? "New" : null;
          if (!label) return null;
          return (
            <span className="absolute left-3 bottom-3 rounded-full bg-[#FDF9F0]/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#0c4d47] ring-1 ring-[#0c4d47]/20 backdrop-blur-sm">
              {label}
            </span>
          );
        })()}
        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0a2225]">
          {priceLabel}
        </div>
        <div className="absolute right-3 bottom-3" onClick={(e) => e.stopPropagation()}>
          <ShareButton
            variant="icon"
            url={`/itinerary-guide/${guide.id}`}
            title={guide.title}
            description={guide.destination}
          />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <h3 className="font-secondary text-[16px] font-medium leading-snug text-[#0a2225] line-clamp-2">
            {guide.title}
          </h3>
          <div className="flex items-center gap-3 text-[12px] text-[#6B7280]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {guide.destination}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {guide.duration_days} days
            </span>
          </div>
        </div>

        {guide.description && (
          <p className="text-[13px] leading-relaxed text-[#6B7280] line-clamp-2">
            {guide.description}
          </p>
        )}

        {guide.creator && (
          <div className="flex items-center gap-2 border-t border-[#E5DFC6]/60 pt-3">
            <Avatar className="h-6 w-6">
              {guide.creator.avatar_url && (
                <AvatarImage src={guide.creator.avatar_url} alt={creatorName} />
              )}
              <AvatarFallback className="bg-[#F5F0E8] text-[10px] text-[#0a2225]">
                {creatorName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[12px] text-[#6B7280]">by {creatorName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
