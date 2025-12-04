import { useNavigate } from "react-router-dom";

interface AgentCardProps {
  agent: {
    id: string;
    agency_name: string;
    user_id?: string;
    logo_url?: string;
    profile_image_url?: string;
    business_address?: string;
    destinations?: string[];
    experience_years?: number;
    years_in_business?: number;
    rating?: number;
    total_reviews?: number;
    specialties?: string[];
    specializations?: string[];
    is_verified?: boolean;
    description?: string;
    bio?: string;
    trust_score?: number;
  };
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/agents/${agent.id}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLocation = () => {
    if (agent.business_address) return agent.business_address;
    if (agent.destinations && agent.destinations.length > 0) {
      return agent.destinations[0];
    }
    return "Location not specified";
  };

  const avatarUrl = agent.profile_image_url || agent.logo_url;
  const yearsExperience = agent.experience_years || agent.years_in_business;
  const specialties = agent.specializations || agent.specialties || [];
  const description = agent.bio || agent.description;

  return (
    <div className="flex flex-col rounded-2xl border border-[#E5DFC6] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {/* Header: Avatar + Name/Badge + Stats */}
      <div className="flex items-start gap-3">
        {/* Avatar or Initials */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={agent.agency_name}
            className="h-11 w-11 rounded-full object-cover bg-[#FBF9F0]"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF9F0] text-sm font-semibold text-[#0a2225]/50">
            {getInitials(agent.agency_name)}
          </div>
        )}
        
        {/* Name + Badge + Rating/Reviews/Years/Location */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[#0a2225]">
              {agent.agency_name}
            </h3>
            {agent.is_verified && (
              <span className="rounded-full bg-[#C7A962]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0a2225]">
                Certified Agent
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#0a2225]/60">
            {agent.rating !== undefined && agent.total_reviews !== undefined && agent.total_reviews > 0 && (
              <>
                <span className="text-[#C7A962]">★</span>
                <span className="text-[#0a2225]">{agent.rating.toFixed(1)}</span>
                <span className="text-[#0a2225]/50">
                  ({agent.total_reviews} reviews)
                </span>
              </>
            )}
            {yearsExperience && (
              <>
                <span className="text-[#0a2225]/30">•</span>
                <span>{yearsExperience} yrs experience</span>
              </>
            )}
            <span className="text-[#0a2225]/30">•</span>
            <span>{getLocation()}</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {description && (
        <p className="mt-2 line-clamp-2 text-xs text-[#0a2225]/70">
          {description}
        </p>
      )}

      {/* Trust Score */}
      {agent.trust_score !== undefined && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-[#0a2225]/50">
            Trust Score
          </p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#FBF9F0]">
            <div
              className="h-full rounded-full bg-[#C7A962]"
              style={{ width: `${Math.min(agent.trust_score, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {specialties.slice(0, 4).map((spec, idx) => (
            <span
              key={idx}
              className="rounded-full bg-[#C7A962]/10 px-2 py-0.5 text-[10px] font-medium text-[#0a2225]"
            >
              {spec}
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
        className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[#0C4D47] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0a3d39]"
      >
        View full profile
      </button>
    </div>
  );
};
