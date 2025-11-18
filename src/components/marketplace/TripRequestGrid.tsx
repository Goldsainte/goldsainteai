import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, DollarSign } from "lucide-react";

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
          className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E5DFC6]/30 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <h3 className="mb-2 font-display text-xl text-[#0a2225] line-clamp-2">
            {request.title}
          </h3>

          {request.description && (
            <p className="mb-3 text-sm leading-relaxed text-[#4a4a4a] line-clamp-2">
              {request.description}
            </p>
          )}

          <div className="flex flex-col gap-2 text-sm text-[#8D8D8D]">
            {request.destination && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{request.destination}</span>
              </div>
            )}

            {(request.budget_min || request.budget_max) && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>
                  {request.budget_min && request.budget_max
                    ? `$${request.budget_min} - $${request.budget_max}`
                    : request.budget_min
                    ? `From $${request.budget_min}`
                    : `Up to $${request.budget_max}`}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Posted {new Date(request.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
