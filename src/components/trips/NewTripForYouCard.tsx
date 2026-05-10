import { Link } from "react-router-dom";
import { MapPin, Users, Calendar, DollarSign, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TripRequestStatus } from "@/lib/trips/statusMachine";

export interface NewTripForYouCardProps {
  tripRequestId: string;
  matchId: string; // NEW: ID of the trip_request_matches row
  createdAt: string;

  // Brand/collection attribution
  sourceBrandProfileId: string;
  brandName: string;
  brandAvatarUrl?: string | null;
  sourceCollectionId?: string | null;
  collectionTitle?: string | null;
  collectionTags?: string[] | null;

  // Trip details
  destination?: string | null;
  dateRange: string | null;
  travelersCount: number;
  budgetRange: string | null;

  // Match info
  status: TripRequestStatus;
  matchScore?: number;
  matchReasons?: string;
  matchStatus?: "new" | "accepted" | "declined"; // NEW: Match-level status

  // Actions
  onOpenRequest: () => void;
  onAccept?: () => void; // NEW
  onDecline?: () => void; // NEW
}

export function NewTripForYouCard(props: NewTripForYouCardProps) {
  const {
    createdAt,
    sourceBrandProfileId,
    brandName,
    brandAvatarUrl,
    sourceCollectionId,
    collectionTitle,
    collectionTags,
    destination,
    dateRange,
    travelersCount,
    budgetRange,
    status,
    matchScore,
    matchReasons,
    matchStatus = "new",
    onOpenRequest,
    onAccept,
    onDecline,
  } = props;

  const displayDate = new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const statusLabel: Record<TripRequestStatus, string> = {
    open: "Open",
    matched: "Matched",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const statusColor: Record<TripRequestStatus, string> = {
    open: "bg-emerald-50 text-emerald-800 border-emerald-200",
    matched: "bg-[#F0F7F6] text-[#0c4d47] border-[#0c4d47]/20",
    in_progress: "bg-amber-50 text-amber-800 border-amber-200",
    completed: "bg-slate-50 text-slate-800 border-slate-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
  };

  const tags = collectionTags ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E5DFC6] bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#F5F0E0]">
            {brandAvatarUrl ? (
              <img
                src={brandAvatarUrl}
                alt={brandName}
                className="h-full w-full object-cover"
              loading="lazy"/>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#0a2225]">
                {brandName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">
              New trip for you · {displayDate}
            </p>
            <p className="truncate text-sm font-semibold text-[#0a2225]">
              {brandName}
            </p>
            {collectionTitle && (
              <p className="truncate text-xs text-[#4a4a4a]">
                Inspired by <span className="font-medium">"{collectionTitle}"</span>
              </p>
            )}
          </div>
        </div>

        <Badge
          className={`flex-shrink-0 border px-2 py-0.5 text-[11px] ${statusColor[status]}`}
        >
          {statusLabel[status]}
        </Badge>
      </div>

      {/* Match score & reasons */}
      {matchScore !== undefined && (
        <div className="flex items-center gap-2 text-xs text-[#4a4a4a]">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-2 py-0.5">
            <span className="font-semibold text-[#BFAD72]">{matchScore.toFixed(0)}</span>
            <span className="text-[10px]">match</span>
          </div>
          {matchReasons && (
            <span className="truncate text-[11px]">{matchReasons}</span>
          )}
        </div>
      )}

      {/* Trip summary chips */}
      <div className="flex flex-wrap gap-2 text-[11px] text-[#4a4a4a]">
        {destination && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
            <MapPin className="h-3 w-3 text-[#BFAD72]" />
            {destination}
          </span>
        )}
        {dateRange && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
            <Calendar className="h-3 w-3 text-[#BFAD72]" />
            {dateRange}
          </span>
        )}
        {travelersCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
            <Users className="h-3 w-3 text-[#BFAD72]" />
            {travelersCount} traveler{travelersCount > 1 ? "s" : ""}
          </span>
        )}
        {budgetRange && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
            <DollarSign className="h-3 w-3 text-[#BFAD72]" />
            {budgetRange}
          </span>
        )}
      </div>

      {/* Tags / vibe */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-[#FDFBF5] px-3 py-1 text-[11px] text-[#4a4a4a]"
            >
              <Tag className="h-3 w-3 text-[#7A7151]" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-1 flex items-center justify-between gap-2">
        {sourceCollectionId ? (
          <Link
            to={`/brands/${sourceBrandProfileId}/collections/${sourceCollectionId}`}
            className="text-[11px] text-[#7A7151] underline-offset-4 hover:underline"
          >
            View collection
          </Link>
        ) : (
          <span className="text-[11px] text-[#8C8470]">
            Collection no longer available
          </span>
        )}

        <div className="flex items-center gap-2">
          {matchStatus === "new" && onDecline && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onDecline}
            >
              Not a fit
            </Button>
          )}
          
          {matchStatus === "new" && onAccept ? (
            <Button
              size="sm"
              className="text-xs"
              onClick={onAccept}
            >
              Accept trip
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onOpenRequest}
            >
              {matchStatus === "accepted" ? "View details" : "Open request"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
