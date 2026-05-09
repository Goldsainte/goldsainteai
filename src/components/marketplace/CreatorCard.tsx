import { useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

interface CreatorCardProps {
  creator: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    identity_verified?: boolean;
    stats: {
      trips_created: number;
      avg_views: number;
      avg_engagement?: number;
    };
    specialties?: string[];
    rating?: number;
    review_count?: number;
  };
}

export const CreatorCard = ({ creator }: CreatorCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/creators/${creator.id}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {/* Header with Avatar and Info */}
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#E5DFC6] bg-[#f7f3ea]">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name || creator.username || "Creator"}
              className="h-full w-full object-cover"
            loading="lazy"/>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#0a2225]/60">
              {getInitials(creator.full_name || creator.username)}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-secondary text-base font-semibold text-[#0a2225]">
              {creator.full_name || creator.username}
            </span>
            {creator.identity_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#C7A962]/10 px-2 py-0.5 text-[10px] font-medium text-[#0a2225]">
                <BadgeCheck className="h-3 w-3 text-[#C7A962]" />
                Verified
              </span>
            )}
          </div>
          {creator.username && (
            <span className="text-[12px] text-[#0a2225]/60">@{creator.username}</span>
          )}
          {creator.rating !== undefined && creator.review_count !== undefined && creator.review_count > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-[#0a2225]">
              <span className="text-[#C7A962]">★</span> {creator.rating.toFixed(1)}
              <span className="text-[#0a2225]/50">
                ({creator.review_count} {creator.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {creator.bio && (
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-[#0a2225]/70">
          {creator.bio}
        </p>
      )}

      {/* Stats */}
      <div className="mt-4 flex items-center gap-5 text-xs">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#0a2225]/50">
            Trips Created
          </p>
          <p className="font-semibold text-[#0a2225]">
            {creator.stats.trips_created}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#0a2225]/50">
            Engagement
          </p>
          <p className="font-semibold text-[#0a2225]">
            {creator.stats.avg_engagement !== undefined 
              ? `${(creator.stats.avg_engagement * 100).toFixed(1)}%` 
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#0a2225]/50">
            Avg. Views
          </p>
          <p className="font-semibold text-[#0a2225]">
            {formatNumber(creator.stats.avg_views)}
          </p>
        </div>
      </div>

      {/* Specialties */}
      {creator.specialties && creator.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {creator.specialties.slice(0, 4).map((specialty, idx) => (
            <span
              key={idx}
              className="rounded-full bg-[#C7A962]/10 px-2.5 py-1 text-[10px] font-medium text-[#0a2225]"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0c4d47] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0a3d39]"
      >
        Send partnership proposal
      </button>
    </div>
  );
};
