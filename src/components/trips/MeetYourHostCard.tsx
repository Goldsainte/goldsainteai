import { useNavigate } from "react-router-dom";
import { Star, ExternalLink } from "lucide-react";

interface MeetYourHostCardProps {
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  hostBio?: string;
  hostRating?: number;
  hostReviewCount?: number;
  hostType: "creator" | "agent";
}

export function MeetYourHostCard({
  hostId,
  hostName,
  hostAvatar,
  hostBio,
  hostRating = 5,
  hostReviewCount,
  hostType,
}: MeetYourHostCardProps) {
  const navigate = useNavigate();

  const profilePath = hostType === "creator" 
    ? `/creators/${hostId}` 
    : `/agents/${hostId}`;

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
        Meet Your Host
      </p>

      <div className="mt-4 flex items-start gap-4">
        {/* Avatar */}
        <img
          src={hostAvatar || "/placeholder.svg"}
          alt={hostName}
          className="h-20 w-20 rounded-full object-cover ring-2 ring-[#C7B892]/30"
        loading="lazy"/>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-secondary text-xl font-semibold text-[#0a2225]">
            {hostName}
          </h3>
          
          {/* Rating */}
          <div className="mt-1 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(hostRating)
                    ? "fill-[#C7B892] text-[#C7B892]"
                    : "text-[#E5DFC6]"
                }`}
              />
            ))}
            {hostReviewCount !== undefined && (
              <span className="ml-1 text-sm text-[#6B7280]">
                ({hostReviewCount} reviews)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {hostBio && (
        <p className="mt-4 text-[14px] leading-relaxed text-[#4a4a4a] line-clamp-4">
          {hostBio}
        </p>
      )}

      {/* View Profile Button */}
      <button
        onClick={() => navigate(profilePath)}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0C4D47] hover:underline"
      >
        View Full Profile
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
