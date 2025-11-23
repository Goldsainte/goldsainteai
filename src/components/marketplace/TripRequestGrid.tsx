import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, DollarSign } from "lucide-react";
import { getTripRequestImageUrl } from "@/utils/tripImages";

interface TripRequest {
  id: string;
  title: string;
  description?: string;
  destination?: string;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface TripRequestGridProps {
  requests: TripRequest[];
}

export function TripRequestGrid({ requests }: TripRequestGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <div
          key={request.id}
          onClick={() => navigate(`/marketplace/request/${request.id}`)}
          className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E5DFC6]/40 bg-white shadow-sm transition-all hover:shadow-md"
        >
          {/* Cover image */}
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src={getTripRequestImageUrl(request.destination)}
              alt={request.destination || request.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

            {/* Destination pill over image */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] font-medium text-white drop-shadow">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">
                {request.destination || "Anywhere"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 px-5 pb-4 pt-4">
            <h3 className="font-display text-lg text-[#0a2225] line-clamp-2">
              {request.title}
            </h3>

            {request.description && (
              <p className="text-sm leading-relaxed text-[#4a4a4a] line-clamp-2">
                {request.description}
              </p>
            )}

            <div className="flex flex-col gap-1.5 text-xs text-[#8D8D8D]">
              {(request.budget_min || request.budget_max) && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>
                    {request.budget_min && request.budget_max
                      ? `$${request.budget_min} – $${request.budget_max}`
                      : request.budget_min
                      ? `From $${request.budget_min}`
                      : `Up to $${request.budget_max}`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Posted {new Date(request.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
