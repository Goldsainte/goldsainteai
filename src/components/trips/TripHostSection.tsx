import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";

interface TripHostSectionProps {
  host: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  hostTagline?: string | null;
  hostType?: 'creator' | 'agent';
}

export function TripHostSection({ host, hostTagline, hostType = 'creator' }: TripHostSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white/80 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
        {hostType === 'agent' ? 'Your Specialist' : 'Your Host'}
      </p>

      <div className="mt-4 flex items-start gap-4">
        <img
          src={host.avatar_url || "/placeholder.svg"}
          alt={host.full_name || (hostType === 'agent' ? 'Travel Specialist' : 'Creator')}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-[#C7B892]/30"
        loading="lazy"/>
        <div className="flex-1">
          <h4 className="font-secondary text-lg font-semibold text-[#0a2225]">
            {host.full_name || (hostType === 'agent' ? 'Travel Specialist' : 'Creator')}
          </h4>
          {hostTagline && (
            <p className="text-[14px] text-[#4a4a4a]">{hostTagline}</p>
          )}
          {host.username && (
            <p className="text-[13px] text-[#818181]">@{host.username}</p>
          )}
        </div>
      </div>

      {host.bio && (
        <p className="mt-4 text-[14px] leading-relaxed text-[#4a4a4a] line-clamp-4">
          {host.bio}
        </p>
      )}

      <button
        onClick={() => navigate(hostType === 'agent' ? `/agents/${host.id}` : `/creators/${host.id}`)}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0C4D47] hover:underline"
      >
        View profile
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
