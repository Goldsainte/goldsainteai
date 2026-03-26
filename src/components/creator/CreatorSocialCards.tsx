import { Instagram, Linkedin, Youtube, Twitter, ExternalLink, Users } from "lucide-react";
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

interface Props {
  accounts: SocialAccount[];
}

export function CreatorSocialCards({ accounts }: Props) {
  if (accounts.length === 0) return null;

  const totalReach = accounts.reduce((sum, a) => sum + a.followers_count, 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
          Social Presence
        </h2>
        {totalReach > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Users className="h-3.5 w-3.5 text-[#C7A962]" />
            Total reach: <span className="font-semibold text-[#0a2225]">{formatFollowers(totalReach)}+</span> followers
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {accounts.map((acc) => (
          <a
            key={acc.platform}
            href={acc.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 rounded-xl border border-[#E5DFC6] bg-white p-4 hover:border-[#C7A962] hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#0c4d47]/10 group-hover:bg-[#0c4d47]/20 transition-colors">
              <PlatformIcon platform={acc.platform} className="h-5 w-5 text-[#0c4d47]" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-[#0a2225]">
                {PLATFORM_LABELS[acc.platform] || acc.platform}
              </p>
              <p className="text-xs text-[#6B7280]">{acc.handle}</p>
              <p className="text-sm font-bold text-[#0c4d47] mt-1">
                {formatFollowers(acc.followers_count)}
              </p>
              <p className="text-[10px] text-[#6B7280]">followers</p>
            </div>
            <ExternalLink className="h-3 w-3 text-[#C7A962] opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </section>
  );
}
