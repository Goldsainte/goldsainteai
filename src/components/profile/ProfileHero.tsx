import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileHeroProps {
  name: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  bio?: string | null;
  followerDisplay?: string | null;
  storyboardCount?: number;
  postCount?: number;
  responseTimeText?: string | null;
  targetUserId?: string;
  onRequestTrip?: () => void;
  className?: string;
}

export function ProfileHero({
  name,
  avatarUrl,
  isVerified,
  bio,
  followerDisplay,
  storyboardCount = 0,
  postCount = 0,
  responseTimeText,
  targetUserId,
  onRequestTrip,
  className,
}: ProfileHeroProps) {
  return (
    <div className={cn("bg-white", className)}>
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        {/* Main row: avatar + info + actions */}
        <div className="flex items-start gap-6 md:gap-10">
          {/* Avatar with gold ring */}
          <div className="h-24 w-24 md:h-28 md:w-28 shrink-0 overflow-hidden rounded-full border-[3px] border-[#C7A962] bg-white shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6] text-2xl font-bold text-[#0a2225]">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Center: name, bio, stats */}
          <div className="flex-1 min-w-0">
            {/* Name + verified */}
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="font-secondary text-2xl md:text-3xl font-bold text-[#0a2225] truncate">
                {name}
              </h1>
              {isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeCheck className="h-5 w-5 md:h-6 md:w-6 text-[#C7A962] shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#0a2225] text-white text-xs">
                      Verified by Goldsainte
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Bio — 2 lines max */}
            {bio && (
              <p className="text-sm text-[#6B7280] line-clamp-2 max-w-lg mb-3">
                {bio}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-1 text-sm text-[#6B7280] flex-wrap">
              {followerDisplay && (
                <>
                  <span className="font-semibold text-[#0a2225]">{followerDisplay}</span>
                  <span>followers</span>
                  <span className="mx-1.5 text-[#C7A962]">·</span>
                </>
              )}
              <span className="font-semibold text-[#0a2225]">{storyboardCount}</span>
              <span>storyboards</span>
              <span className="mx-1.5 text-[#C7A962]">·</span>
              <span className="font-semibold text-[#0a2225]">{postCount}</span>
              <span>posts</span>
            </div>
          </div>

          {/* Right: CTA + Follow */}
          <div className="hidden md:flex flex-col items-stretch gap-2.5 min-w-[200px]">
            <Button
              onClick={onRequestTrip}
              className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full h-11 font-medium text-sm shadow-sm"
            >
              Get Custom Itinerary
            </Button>
            <p className="text-center text-[10px] text-[#6B7280] leading-relaxed">
              Designed for you · Delivered in 24–48 hours
            </p>
            {targetUserId && (
              <FollowButton targetUserId={targetUserId} />
            )}
            {/* Inline trust text */}
            <p className="text-center text-[10px] text-[#9CA3AF] mt-0.5">
              Verified · Secure · {responseTimeText ? "Responds in 24h" : "Direct messaging"}
            </p>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden mt-5 flex items-center gap-3">
          <Button
            onClick={onRequestTrip}
            className="flex-1 bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full h-11 font-medium text-sm"
          >
            Get Custom Itinerary
          </Button>
          {targetUserId && (
            <div className="w-28">
              <FollowButton targetUserId={targetUserId} />
            </div>
          )}
        </div>
      </div>

      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C7A962]/40 to-transparent" />
    </div>
  );
}
