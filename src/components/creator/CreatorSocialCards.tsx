import { Instagram, Linkedin, Youtube, Twitter, Users } from "lucide-react";
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
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-5">
        Social Presence
      </h2>

      {/* Total Reach */}
      {totalReach > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <Users className="h-4 w-4 text-[#C7A962]" />
          <p className="text-sm text-[#6B7280]">
            Combined social audience: <span className="font-semibold text-[#0a2225]">{formatFollowers(totalReach)}+</span> followers across platforms
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acc) => (
          <a
            key={acc.platform}
            href={acc.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-[#E5DFC6] bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-[#C7A962]/50"
          >
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-[#F5F0E0] group-hover:bg-[#C7A962]/10 transition-colors">
              <PlatformIcon platform={acc.platform} className="h-4.5 w-4.5 text-[#0a2225]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0a2225]">
                {PLATFORM_LABELS[acc.platform] || acc.platform}
              </p>
              <p className="text-xs text-[#6B7280] truncate">{acc.handle}</p>
            </div>
            <span className="text-sm font-semibold text-[#0a2225]">
              {formatFollowers(acc.followers_count)}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
