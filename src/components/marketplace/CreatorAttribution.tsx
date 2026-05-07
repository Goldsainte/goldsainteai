import { Link } from "react-router-dom";

interface CreatorAttributionProps {
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    home_base?: string | null;
    content_style_tags?: string[] | null;
    is_verified?: boolean | null;
  } | null;
  variant?: "card" | "detail";
  className?: string;
}

/**
 * Inline editorial creator attribution used on trip cards and detail pages.
 * Leads with the human behind the trip — soft serif, gold accents, no chrome.
 */
export function CreatorAttribution({ creator, variant = "card", className = "" }: CreatorAttributionProps) {
  if (!creator) return null;
  const name = creator.full_name || "Goldsainte Concierge";
  const initial = name.charAt(0).toUpperCase();
  const styleTag = creator.content_style_tags?.[0];
  const sizes = variant === "detail" ? "h-7 w-7 text-[11px]" : "h-5 w-5 text-[9px]";
  const labelSize = variant === "detail" ? "text-[12px]" : "text-[11px]";

  const inner = (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {creator.avatar_url ? (
        <img
          src={creator.avatar_url}
          alt={name}
          className={`${sizes} rounded-full object-cover ring-1 ring-[#C7B892]/40`}
          loading="lazy"
        />
      ) : (
        <span className={`${sizes} flex items-center justify-center rounded-full bg-[#C7B892]/15 font-secondary text-[#7A7151] ring-1 ring-[#C7B892]/40`}>
          {initial}
        </span>
      )}
      <span className={`${labelSize} text-[#7A7151] truncate`}>
        <span className="text-[#6B7280]">Curated by </span>
        <span className="font-secondary italic text-[#0a2225]">{name}</span>
        {creator.home_base && (
          <span className="text-[#6B7280]"> · {creator.home_base}</span>
        )}
      </span>
      {styleTag && variant === "detail" && (
        <span className="ml-1 rounded-full border border-[#C7B892]/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#7A7151]">
          {styleTag}
        </span>
      )}
    </div>
  );

  return (
    <Link
      to={`/creators/${creator.id}`}
      onClick={(e) => e.stopPropagation()}
      className="block hover:opacity-80 transition-opacity"
    >
      {inner}
    </Link>
  );
}