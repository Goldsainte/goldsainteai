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
    <div className={cn("bg-gradient-to-b from-[#FDF9F0] to-white", className)}>
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        {/* Avatar + Identity */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar with gold ring */}
          <div className="h-28 w-28 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-full border-[3.5px] border-[#C7A962] bg-white shadow-md mb-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6] text-2xl font-bold text-[#0a2225]">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + verified */}
          <div className="flex items-center gap-2.5 mb-2">
            <h1 className="font-secondary text-3xl md:text-4xl font-bold text-[#0a2225]">
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

          {/* Bio — italic serif tagline */}
          {bio && (
            <p className="font-primary italic text-base text-[#6B7280] line-clamp-2 max-w-lg mb-6">
              {bio}
            </p>
          )}

          {/* Gold flourish divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C7A962]/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C7A962]/50" />
          </div>

          {/* Stats — spaced out with gold dividers */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mb-8">
            {followerDisplay && (
              <>
                <div className="text-center">
                  <span className="block font-secondary text-lg font-bold text-[#0a2225]">{followerDisplay}</span>
                  <span className="text-[11px] uppercase tracking-wider text-[#6B7280]">Followers</span>
                </div>
                <div className="h-8 w-px bg-[#C7A962]/30" />
              </>
            )}
            <div className="text-center">
              <span className="block font-secondary text-lg font-bold text-[#0a2225]">{storyboardCount}</span>
              <span className="text-[11px] uppercase tracking-wider text-[#6B7280]">Storyboards</span>
            </div>
            <div className="h-8 w-px bg-[#C7A962]/30" />
            <div className="text-center">
              <span className="block font-secondary text-lg font-bold text-[#0a2225]">{postCount}</span>
              <span className="text-[11px] uppercase tracking-wider text-[#6B7280]">Posts</span>
            </div>
          </div>

          {/* CTA — centered, full-width feel */}
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <Button
              onClick={onRequestTrip}
              className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full h-12 font-medium text-sm shadow-sm"
            >
              Get Custom Itinerary
            </Button>
            <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
              Designed for you · Delivered in 24–48 hours
            </p>
            {targetUserId && (
              <div className="w-full">
                <FollowButton targetUserId={targetUserId} />
              </div>
            )}
            <p className="text-[10px] text-[#9CA3AF]">
              Verified · Secure · {responseTimeText ? "Responds in 24h" : "Direct messaging"}
            </p>
          </div>
        </div>
      </div>

      {/* Gold divider */}
      <div className="flex items-center gap-3 justify-center pb-0">
        <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-[#C7A962]/40 to-transparent" />
      </div>
    </div>
  );
}
