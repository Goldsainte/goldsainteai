import {
  Star,
  ExternalLink,
  Bookmark,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  CheckCircle,
  Clock,
  Activity,
  Eye,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import FollowButton from "@/components/FollowButton";
import { formatDistanceToNow } from "date-fns";

interface SocialLink {
  platform: string;
  handle: string;
  url: string;
  followersCount?: number;
}

interface SidebarStoryboard {
  id: string;
  title: string;
  cover_image_url?: string | null;
  destination?: string | null;
  tags?: string[] | null;
  view_count?: number | null;
  created_at?: string | null;
}

interface ProfileSidebarProps {
  name: string;
  rating?: number | null;
  reviewCount?: number | null;
  storyboards?: SidebarStoryboard[];
  website?: string | null;
  socialLinks?: SocialLink[];
  onRequestTrip?: () => void;
  onSaveToStoryboard?: () => void;
  showHowItWorks?: boolean;
  showTrustBadges?: boolean;
  targetUserId?: string;
  lastActiveAt?: string | null;
  responseTimeHours?: number | null;
  requestTripMicrocopy?: string;
  className?: string;
}

function formatViewCount(n: number | null | undefined): string {
  if (!n || n <= 0) return "0";
  return Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

export function ProfileSidebar({
  name,
  rating,
  reviewCount,
  storyboards = [],
  website,
  socialLinks = [],
  onRequestTrip,
  onSaveToStoryboard,
  showHowItWorks = true,
  showTrustBadges = true,
  targetUserId,
  lastActiveAt,
  responseTimeHours,
  requestTripMicrocopy,
  className,
}: ProfileSidebarProps) {
  const lastActiveText = lastActiveAt
    ? `Active ${formatDistanceToNow(new Date(lastActiveAt), { addSuffix: false })} ago`
    : null;

  const responseTimeText = responseTimeHours
    ? responseTimeHours <= 1
      ? "Responds within 1 hour"
      : responseTimeHours <= 24
      ? `Responds within ${responseTimeHours} hours`
      : `Responds within ${Math.ceil(responseTimeHours / 24)} days`
    : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Rating */}
      {rating != null && rating > 0 && (
        <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= Math.round(rating)
                    ? "fill-[#C7A962] text-[#C7A962]"
                    : "fill-[#E5DFC6] text-[#E5DFC6]"
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0a2225]">
            {rating.toFixed(1)}
          </p>
          <p className="text-xs text-[#6B7280]">
            Based on {reviewCount ?? 0} reviews
          </p>
        </div>
      )}

      {/* Storyboards */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          Storyboards
        </h3>

        {storyboards.length > 0 ? (
          <div className="space-y-3">
            {storyboards.map((sb) => (
              <Link
                key={sb.id}
                to={`/storyboards/${sb.id}`}
                className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition-all hover:bg-[#F5F0E0]/60 hover:shadow-sm"
              >
                {/* Thumbnail */}
                <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-[#E5DFC6] overflow-hidden">
                  {sb.cover_image_url ? (
                    <img
                      src={sb.cover_image_url}
                      alt={sb.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-[#7A7151]" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a2225] truncate group-hover:text-[#0c4d47] transition-colors">
                    {sb.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                    {sb.destination && (
                      <span className="truncate">{sb.destination}</span>
                    )}
                    {sb.destination && (sb.view_count ?? 0) > 0 && (
                      <span>·</span>
                    )}
                    {(sb.view_count ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {formatViewCount(sb.view_count)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#C7A962] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
            ))}

            <Link
              to="/storyboards"
              className="block text-center text-xs font-medium text-[#0c4d47] hover:text-[#0a3d39] pt-2 transition-colors"
            >
              View all storyboards →
            </Link>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-4 w-4 fill-[#E5DFC6] text-[#E5DFC6]"
                />
              ))}
            </div>
            <p className="text-sm text-[#6B7280]">New creator</p>
            <p className="text-[10px] text-[#9CA3AF] mt-1">
              Storyboards coming soon
            </p>
          </div>
        )}

        {/* Activity & Response indicators */}
        {(lastActiveText || responseTimeText) && (
          <div className="mt-4 pt-4 border-t border-[#E5DFC6] space-y-2">
            {lastActiveText && (
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <Activity className="h-3.5 w-3.5 text-green-500" />
                {lastActiveText}
              </div>
            )}
            {responseTimeText && (
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <Clock className="h-3.5 w-3.5 text-[#C7A962]" />
                {responseTimeText}
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-5 space-y-2.5">
          {targetUserId && (
            <FollowButton targetUserId={targetUserId} />
          )}

          <Button
            onClick={onRequestTrip}
            className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl h-11 font-medium"
          >
            Request a Trip
          </Button>
          {requestTripMicrocopy && (
            <p className="text-[10px] text-center text-[#6B7280]">
              {requestTripMicrocopy}
            </p>
          )}

          {website && (
            <Button
              variant="outline"
              asChild
              className="w-full border-[#E5DFC6] hover:bg-[#F5F0E0] rounded-xl h-11"
            >
              <a href={website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit website
              </a>
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onSaveToStoryboard}
            className="w-full hover:bg-[#F5F0E0] rounded-xl h-11 text-[#0a2225]"
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Save to storyboard
          </Button>
        </div>
      </div>

      {/* Trust & Safety */}
      {showTrustBadges && (
        <div className="rounded-2xl border border-[#E5DFC6] bg-[#F5F0E0]/50 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
            Trust & Safety
          </h3>
          <ul className="space-y-3">
            {[
              { icon: ShieldCheck, text: "Verified partner" },
              { icon: CreditCard, text: "Secure booking through Goldsainte" },
              { icon: MessageCircle, text: "On-platform messaging" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-[#0c4d47]" />
                <span className="text-sm text-[#0a2225]">{text}</span>
              </li>
            ))}
            <li>
              <Link
                to="/dispute-resolution"
                className="flex items-center gap-2.5 hover:underline"
              >
                <CheckCircle className="h-4 w-4 text-[#0c4d47]" />
                <span className="text-sm text-[#0a2225]">Dispute resolution support</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
