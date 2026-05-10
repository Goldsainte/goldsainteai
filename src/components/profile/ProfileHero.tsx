import { BadgeCheck, Instagram, Linkedin, Youtube, Twitter, MapPin, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialAccount {
  platform: string;
  handle: string;
  profile_url: string;
  followers_count: number;
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return count.toString();
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case "instagram": return <Instagram className={className} />;
    case "linkedin": return <Linkedin className={className} />;
    case "youtube": return <Youtube className={className} />;
    case "twitter": return <Twitter className={className} />;
    case "tiktok": return <span className={cn("inline-flex items-center justify-center font-bold", className)} style={{ fontSize: "0.65em" }}>Tk</span>;
    default: return <span className={cn("inline-flex items-center justify-center font-bold uppercase", className)} style={{ fontSize: "0.6em" }}>{platform.slice(0, 2)}</span>;
  }
}

interface ProfileHeroProps {
  name: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  bio?: string | null;
  location?: string | null;
  specialties?: string[];
  socialAccounts?: SocialAccount[];
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
  location,
  specialties = [],
  socialAccounts = [],
  followerDisplay,
  storyboardCount = 0,
  postCount = 0,
  responseTimeText,
  targetUserId,
  onRequestTrip,
  className,
}: ProfileHeroProps) {
  const totalReach = socialAccounts.reduce((sum, a) => sum + a.followers_count, 0);

  return (
    <div className={cn("bg-gradient-to-b from-[#FDF9F0] to-white", className)}>
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        {/* Avatar + Identity */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar with gold ring */}
          <div className="h-28 w-28 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-full border-[3.5px] border-[#C7A962] bg-white shadow-md mb-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" loading="lazy"/>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6] text-2xl font-bold text-[#0a2225]">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-secondary text-3xl md:text-4xl font-bold text-[#0a2225]">
              {name}
            </h1>
            {isVerified && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-[#C7A962]/40 bg-[#C7A962]/10 px-3 py-1 text-xs font-medium text-[#7a5d1c]"
                title="Verified by Goldsainte"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#C7A962]" />
                Goldsainte Verified
              </span>
            )}
          </div>

          {/* Location — small line under name */}
          {location && (
            <p className="flex items-center gap-1.5 text-sm text-[#6B7280] mb-3">
              <MapPin className="h-3.5 w-3.5 text-[#C7A962]" />
              {location}
            </p>
          )}

          {/* Bio — italic serif, up to 4 lines */}
          {bio && (
            <p className="font-primary italic text-base text-[#6B7280] line-clamp-4 max-w-lg mb-4">
              {bio}
            </p>
          )}

          {/* Specialty pills */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {specialties.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="text-xs font-medium uppercase tracking-wider text-[#6B7280] border border-[#E5DFC6] rounded-full px-3 py-1"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Gold flourish divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C7A962]/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C7A962]/50" />
          </div>

          {/* Social icons row */}
          {socialAccounts.length > 0 && (
            <div className="flex items-center gap-4 mb-6 text-sm text-[#6B7280]">
              <div className="flex items-center gap-3">
                {socialAccounts.map((acc) => (
                  <TooltipProvider key={acc.platform}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={acc.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6B7280] hover:text-[#0a2225] transition-colors"
                        >
                          <PlatformIcon platform={acc.platform} className="h-[18px] w-[18px]" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#0a2225] text-white text-xs">
                        {acc.handle} · {formatFollowers(acc.followers_count)} followers
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              {totalReach > 0 && (
                <>
                  <span className="text-[#E5DFC6]">·</span>
                  <span className="text-sm text-[#6B7280]">{formatFollowers(totalReach)}+ followers</span>
                </>
              )}
            </div>
          )}

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
              Design My Trip
            </Button>
            <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
              Your dream trip, designed by a local expert
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
