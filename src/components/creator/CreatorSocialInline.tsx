import { Instagram, Linkedin, Youtube, Twitter } from "lucide-react";
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
    default: return <span className={`inline-block text-[10px] font-bold uppercase ${className}`}>{platform.slice(0, 2)}</span>;
  }
}

interface Props {
  accounts: SocialAccount[];
}

export function CreatorSocialInline({ accounts }: Props) {
  if (accounts.length === 0) return null;

  const totalReach = accounts.reduce((sum, a) => sum + a.followers_count, 0);

  return (
    <div className="mt-5 flex items-center gap-4 text-sm text-[#6B7280]">
      <div className="flex items-center gap-2">
        {accounts.map((acc) => (
          <a
            key={acc.platform}
            href={acc.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B7280] hover:text-[#0a2225] transition-colors"
            title={`${acc.handle} on ${acc.platform}`}
          >
            <PlatformIcon platform={acc.platform} className="h-4 w-4" />
          </a>
        ))}
      </div>
      {totalReach > 0 && (
        <>
          <span className="text-[#E5DFC6]">·</span>
          <span className="text-xs">{formatFollowers(totalReach)}+ social followers</span>
        </>
      )}
    </div>
  );
}
