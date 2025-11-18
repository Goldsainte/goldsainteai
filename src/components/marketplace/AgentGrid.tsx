import { useNavigate } from "react-router-dom";
import { MapPin, Star, Briefcase } from "lucide-react";

interface Agent {
  id: string;
  agency_name: string;
  logo_url?: string;
  rating?: number;
  experience_years?: number;
  specialties?: string[];
  description?: string;
  business_address?: string;
  destinations?: string[];
}

interface AgentGridProps {
  agents: Agent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <div
          key={agent.id}
          onClick={() => navigate(`/agent/${agent.id}`)}
          className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E5DFC6]/30 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          {/* Logo/Header */}
          <div className="mb-4 flex items-start gap-3">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#FBF9F0] to-[#E5DFC6]/20">
              {agent.logo_url ? (
                <img
                  src={agent.logo_url}
                  alt={agent.agency_name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Briefcase className="h-8 w-8 text-[#BFAD72]" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-display text-lg leading-tight text-[#0a2225]">
                {agent.agency_name}
              </h3>
              {agent.rating && (
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#BFAD72] text-[#BFAD72]" />
                  <span className="text-sm font-medium text-[#0a2225]">{agent.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#8D8D8D]">
            {agent.experience_years && (
              <span>{agent.experience_years} years experience</span>
            )}
            {agent.business_address && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{agent.business_address}</span>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          {agent.description && (
            <p className="mb-3 text-sm leading-relaxed text-[#4a4a4a] line-clamp-2">
              {agent.description}
            </p>
          )}

          {/* Specialties */}
          {agent.specialties && agent.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {agent.specialties.slice(0, 3).map((specialty, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-[#E5DFC6] bg-[#FBF9F0] px-2.5 py-1 text-xs text-[#0a2225]"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
