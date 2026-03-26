import { BadgeCheck, Shield, MessageCircle, Clock } from "lucide-react";
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
    <div className={cn("bg-white border-b border-[#E5DFC6]", className)}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Main row: avatar + info + actions */}
        <div className="flex items-start gap-5 md:gap-8">
          {/* Avatar */}
          <div className="h-20 w-20 md:h-24 md:w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#E5DFC6] bg-white">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6] text-xl font-bold text-[#0a2225]">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Center: name, bio, stats */}
          <div className="flex-1 min-w-0">
            {/* Name + verified */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-secondary text-xl md:text-2xl font-bold text-[#0a2225] truncate">
                {name}
              </h1>
              {isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeCheck className="h-5 w-5 text-[#C7A962] shrink-0 cursor-help" />
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
                  <span className="mx-1.5">·</span>
                </>
              )}
              <span className="font-semibold text-[#0a2225]">{storyboardCount}</span>
              <span>storyboards</span>
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-[#0a2225]">{postCount}</span>
              <span>posts</span>
            </div>
          </div>

          {/* Right: CTA + Follow */}
          <div className="hidden md:flex flex-col items-stretch gap-2 min-w-[180px]">
            <Button
              onClick={onRequestTrip}
              className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl h-10 font-medium text-sm"
            >
              Get Custom Itinerary
            </Button>
            <p className="text-center text-[10px] text-[#6B7280]">
              Takes 2 minutes · No commitment
            </p>
            {targetUserId && (
              <FollowButton targetUserId={targetUserId} />
            )}
            {/* Inline trust badges */}
            <div className="flex items-center justify-center gap-3 mt-1 text-[10px] text-[#6B7280]">
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3 w-3 text-[#C7A962]" /> Verified
              </span>
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3 w-3 text-[#C7A962]" /> Secure
              </span>
              {responseTimeText && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#C7A962]" /> 24h
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden mt-4 flex items-center gap-3">
          <Button
            onClick={onRequestTrip}
            className="flex-1 bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl h-10 font-medium text-sm"
          >
            Get Custom Itinerary
          </Button>
          {targetUserId && (
            <div className="w-28">
              <FollowButton targetUserId={targetUserId} />
            </div>
          )}
        </div>

        {/* How it works strip */}
        <div className="mt-4 pt-4 border-t border-[#E5DFC6]/40">
          <p className="text-xs text-[#6B7280] text-center">
            Share your travel style → Get a custom itinerary → Book your trip
          </p>
        </div>
      </div>
    </div>
  );
}
