import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, FileText, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getTripRequestImageUrl } from "@/utils/tripImages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TripRequest {
  id: string;
  title: string;
  description?: string;
  destination?: string;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  created_at: string;
  travelers_adults?: number;
  travelers_children?: number;
  interests?: string[];
  source_metadata?: Record<string, any>;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
  proposal_count?: number;
}

interface TripRequestGridProps {
  requests: TripRequest[];
  isAdmin?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

function getTravelerCount(req: TripRequest): number {
  return (req.travelers_adults || 1) + (req.travelers_children || 0);
}

function getTravelerName(req: TripRequest): string {
  const name = req.profiles?.full_name;
  if (!name) return "A Goldsainte Traveler";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return parts[0];
}

function getTripLength(req: TripRequest): number | null {
  return req.source_metadata?.trip_length_days || null;
}

export function TripRequestGrid({ requests, isAdmin, onDelete }: TripRequestGridProps) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
    setConfirmId(null);
  };

  return (
    <>
    <AlertDialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this trip request?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the trip request and all associated messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => confirmId && handleDelete(confirmId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={!!deletingId}
          >
            {deletingId ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {requests.map((request) => {
        const travelerCount = getTravelerCount(request);
        const travelerName = getTravelerName(request);
        const tripLength = getTripLength(request);
        const vibes = (request.interests || []).slice(0, 3);
        const proposalCount = request.proposal_count || 0;

        return (
          <article
            key={request.id}
            onClick={() => navigate(`/marketplace/request/${request.id}`)}
            className="group cursor-pointer space-y-2.5"
          >
            {/* Image with "Seeking proposals" overlay */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
              <img
                src={getTripRequestImageUrl(request.destination)}
                alt={request.destination || request.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-[#0a2225] shadow-sm">
                  <FileText className="h-3 w-3" />
                  Seeking proposals
                </span>
              </div>

              {isAdmin && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmId(request.id);
                  }}
                  disabled={deletingId === request.id}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-red-50 disabled:opacity-50"
                  aria-label="Delete trip request"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 px-0.5">
              {/* Traveler identity + count */}
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  {request.profiles?.avatar_url && (
                    <AvatarImage src={request.profiles.avatar_url} alt={travelerName} />
                  )}
                  <AvatarFallback className="text-[8px] bg-[#FBF9F0] text-[#BFAD72]">
                    {travelerName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[12px] text-[#6B7280] truncate">
                  {travelerName} · {travelerCount} {travelerCount === 1 ? "traveler" : "travelers"}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">
                {request.title}
              </h3>

              {/* Destination + trip length */}
              <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{request.destination || "Anywhere"}</span>
                {tripLength && (
                  <span className="ml-1">· {tripLength} days</span>
                )}
              </p>

              {/* Vibe tags */}
              {vibes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {vibes.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full bg-[#FBF9F0] text-[#6B7280] border-[#E5DFC6] text-[10px] px-2 py-0 font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Budget + proposal count */}
              <div className="flex items-center justify-between gap-2">
                {(request.budget_min || request.budget_max) && (
                  <span className="text-sm font-semibold text-[#0a2225] whitespace-nowrap">
                    {request.budget_min && request.budget_max
                      ? `$${request.budget_min.toLocaleString()}–$${request.budget_max.toLocaleString()}`
                      : request.budget_min
                      ? `From $${request.budget_min.toLocaleString()}`
                      : `Up to $${request.budget_max?.toLocaleString()}`}
                  </span>
                )}
                {proposalCount > 0 && (
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] px-2 py-0 border-[#BFAD72] text-[#BFAD72] font-medium"
                  >
                    {proposalCount} {proposalCount === 1 ? "proposal" : "proposals"}
                  </Badge>
                )}
              </div>

              {/* Relative time */}
              <p className="text-[11px] text-[#9CA3AF]">
                Posted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
          </article>
        );
      })}
    </div>
    </>
  );
}
