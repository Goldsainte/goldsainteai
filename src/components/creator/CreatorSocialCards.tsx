import { Instagram, Linkedin, Youtube, Twitter, ExternalLink, Users, ChevronRight } from "lucide-react";
import { formatFollowers } from "./CreatorSocialAccountsEditor";

interface SocialAccount {
  platform: string;
  handle: string;
  profile_url: string;
  followers_count: number;
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case "instagram": return <Instagram className={className} />;
    case "linkedin": return <Linkedin className={className} />;
    case "youtube": return <Youtube className={className} />;
    case "twitter": return <Twitter className={className} />;
    default: return <span className={`inline-block text-xs font-bold ${className}`}>{platform.charAt(0).toUpperCase()}</span>;
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  youtube: "YouTube",
  twitter: "Twitter/X",
};

const PLATFORM_ACCENTS: Record<string, string> = {
  instagram: "bg-gradient-to-br from-[#f9ce34]/10 via-[#ee2a7b]/10 to-[#6228d7]/10",
  tiktok: "bg-[#010101]/5",
  linkedin: "bg-[#0077b5]/8",
  pinterest: "bg-[#e60023]/8",
  youtube: "bg-[#ff0000]/8",
  twitter: "bg-[#1da1f2]/8",
};

const PLATFORM_ICON_BG: Record<string, string> = {
  instagram: "bg-gradient-to-br from-[#f9ce34]/20 via-[#ee2a7b]/20 to-[#6228d7]/20",
  tiktok: "bg-[#010101]/10",
  linkedin: "bg-[#0077b5]/15",
  pinterest: "bg-[#e60023]/15",
  youtube: "bg-[#ff0000]/15",
  twitter: "bg-[#1da1f2]/15",
};

function getSocialProofLabel(count: number): string | null {
  if (count >= 10_000) return "Highly active";
  if (count >= 1_000) return "Growing audience";
  return null;
}

interface Props {
  accounts: SocialAccount[];
}

export function CreatorSocialCards({ accounts }: Props) {
  if (accounts.length === 0) return null;

  const totalReach = accounts.reduce((sum, a) => sum + a.followers_count, 0);

  return (
    <section>
      {/* Total Reach Header */}
      {totalReach > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#C7A962]/10 border border-[#C7A962]/20 px-5 py-3.5">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[#C7A962]/20">
            <Users className="h-4.5 w-4.5 text-[#C7A962]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#7A7151]">Total Social Reach</p>
            <p className="text-lg font-bold text-[#0a2225]">{formatFollowers(totalReach)}+ <span className="text-sm font-normal text-[#6B7280]">followers</span></p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const proofLabel = getSocialProofLabel(acc.followers_count);
          const accent = PLATFORM_ACCENTS[acc.platform] || "bg-[#0c4d47]/5";
          const iconBg = PLATFORM_ICON_BG[acc.platform] || "bg-[#0c4d47]/10";

          return (
            <a
              key={acc.platform}
              href={acc.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative flex items-center gap-4 rounded-xl border border-[#E5DFC6] bg-white p-5 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#C7A962] hover:scale-[1.02] ${accent}`}
            >
              {/* Platform Icon */}
              <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBg} transition-colors group-hover:ring-2 group-hover:ring-[#C7A962]/30`}>
                <PlatformIcon platform={acc.platform} className="h-5.5 w-5.5 text-[#0c4d47]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0a2225]">
                  {PLATFORM_LABELS[acc.platform] || acc.platform}
                </p>
                <p className="text-xs text-[#6B7280] truncate">{acc.handle}</p>
                <p className="text-base font-bold text-[#0c4d47] mt-1">
                  {formatFollowers(acc.followers_count)} <span className="text-xs font-normal text-[#6B7280]">followers</span>
                </p>
                {proofLabel && (
                  <p className="text-[10px] font-medium text-[#C7A962] uppercase tracking-wider mt-0.5">{proofLabel}</p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="flex-shrink-0 h-4 w-4 text-[#C7A962] opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
