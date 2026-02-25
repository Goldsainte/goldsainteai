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
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {requests.map((request) => (
        <article
          key={request.id}
          onClick={() => navigate(`/marketplace/request/${request.id}`)}
          className="group cursor-pointer space-y-2.5"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
            <img
              src={getTripRequestImageUrl(request.destination)}
              alt={request.destination || request.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          <div className="space-y-1 px-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">
                {request.title}
              </h3>
              {(request.budget_min || request.budget_max) && (
                <span className="text-sm md:text-[15px] font-semibold text-[#0a2225] whitespace-nowrap">
                  {request.budget_min && request.budget_max
                    ? `$${request.budget_min}–$${request.budget_max}`
                    : request.budget_min
                    ? `From $${request.budget_min}`
                    : `Up to $${request.budget_max}`}
                </span>
              )}
            </div>

            <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{request.destination || "Anywhere"}</span>
            </p>

            <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Posted {new Date(request.created_at).toLocaleDateString()}</span>
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
