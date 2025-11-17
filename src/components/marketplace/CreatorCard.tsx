import { useNavigate } from "react-router-dom";

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
    <div className="flex flex-col rounded-2xl bg-background p-4 shadow-sm ring-1 ring-border/80 transition hover:-translate-y-1 hover:shadow-lg">
      {/* Header with Avatar and Info */}
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name || creator.username || "Creator"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-foreground">
              {getInitials(creator.full_name || creator.username)}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">
              {creator.full_name || creator.username}
            </span>
            {creator.identity_verified && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Verified Creator
              </span>
            )}
          </div>
          {creator.username && (
            <span className="text-xs text-muted-foreground">@{creator.username}</span>
          )}
          {creator.rating !== undefined && creator.review_count !== undefined && creator.review_count > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-foreground">
              <span>★ {creator.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({creator.review_count} {creator.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {creator.bio && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {creator.bio}
        </p>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Trips Created
          </p>
          <p className="font-semibold text-foreground">
            {creator.stats.trips_created}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Avg. Engagement
          </p>
          <p className="font-semibold text-foreground">
            {creator.stats.avg_engagement !== undefined 
              ? `${(creator.stats.avg_engagement * 100).toFixed(1)}%` 
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Avg. Views
          </p>
          <p className="font-semibold text-foreground">
            {formatNumber(creator.stats.avg_views)}
          </p>
        </div>
      </div>

      {/* Specialties */}
      {creator.specialties && creator.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {creator.specialties.slice(0, 4).map((specialty, idx) => (
            <span
              key={idx}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
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
        className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
      >
        Send partnership proposal
      </button>
    </div>
  );
};
