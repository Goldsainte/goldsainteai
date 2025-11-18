import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

interface Creator {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
}

interface CreatorGridProps {
  creators: Creator[];
}

export function CreatorGrid({ creators }: CreatorGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator) => (
        <div
          key={creator.id}
          onClick={() => navigate(`/creator/${creator.id}`)}
          className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E5DFC6]/30 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          {/* Avatar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-[#FBF9F0] to-[#E5DFC6]/20">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.full_name || creator.username}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-[#BFAD72]" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-display text-lg text-[#0a2225]">
                {creator.full_name || creator.username}
              </h3>
              {creator.username && creator.full_name && (
                <p className="text-sm text-[#8D8D8D]">@{creator.username}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="text-sm leading-relaxed text-[#4a4a4a] line-clamp-3">
              {creator.bio}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
