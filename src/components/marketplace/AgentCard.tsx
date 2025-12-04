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
    <div className="group flex flex-col rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Header: Avatar + Name/Badge */}
      <div className="flex items-center gap-3">
        {/* Avatar or Initials */}
        <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[#E5DFC6] bg-[#f7f3ea]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={agent.agency_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#0a2225]/60">
              {getInitials(agent.agency_name)}
            </div>
          )}
        </div>
        
        {/* Name + Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="truncate font-secondary text-base font-semibold text-[#0a2225]">
              {agent.agency_name}
            </h3>
            {agent.is_verified && (
              <span className="rounded-full bg-[#C7A962]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0a2225]">
                Certified
              </span>
            )}
          </div>
          <div className="truncate text-[12px] text-[#0a2225]/60">
            {getLocation()}
          </div>
        </div>
      </div>

      {/* Stats Pills */}
      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        {agent.rating !== undefined && agent.total_reviews !== undefined && agent.total_reviews > 0 && (
          <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]">
            <span className="text-[#C7A962]">★</span> {agent.rating.toFixed(1)}
          </span>
        )}
        {agent.total_reviews !== undefined && agent.total_reviews > 0 && (
          <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]">
            {agent.total_reviews} reviews
          </span>
        )}
        {yearsExperience && (
          <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]">
            {yearsExperience}+ yrs
          </span>
        )}
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {specialties.slice(0, 3).map((spec, idx) => (
            <span
              key={idx}
              className="rounded-full bg-[#C7A962]/10 px-2.5 py-1 text-[10px] font-medium text-[#0a2225]"
            >
              {spec}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {description && (
        <p className="mt-3 line-clamp-2 text-[11px] text-[#0a2225]/50">
          {description}
        </p>
      )}

      {/* CTA Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="mt-4 flex w-full items-center justify-center rounded-full bg-[#0c4d47] px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#0a3d39]"
      >
        View profile
      </button>
    </div>
  );
};
