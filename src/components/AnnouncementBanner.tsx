import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// AnnouncementBanner — the newsroom strip (Jul 16). Renders the newest
// active row from site_announcements as a slim band above the header.
// Publish/retire via SQL — zero deploys. Dismissal is remembered per
// announcement, so each NEW announcement reappears for everyone.
// ============================================================================

interface Announcement {
  id: string;
  message: string;
  href: string | null;
}

export function AnnouncementBanner() {
  const [a, setA] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("site_announcements" as never)
          .select("id, message, href")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled || !data) return;
        const row = data as unknown as Announcement;
        setA(row);
        setDismissed(localStorage.getItem(`gs_dismissed_announcement_${row.id}`) === "true");
      } catch {
        /* banner is decorative — never let it break a page */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!a || dismissed) return null;

  const isExternal = a.href?.startsWith("http");
  return (
    <div className="relative z-50 bg-[#0a2225] px-10 py-2.5 text-center">
      <p className="text-[13px] tracking-wide text-[#f7f3ea]">
        {a.message}
        {a.href && (
          <a
            href={a.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="ml-2 font-medium text-[#C7A962] underline underline-offset-4 hover:text-[#E2C57E]"
          >
            Read more
          </a>
        )}
      </p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          localStorage.setItem(`gs_dismissed_announcement_${a.id}`, "true");
          setDismissed(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#f7f3ea]/60 transition-colors hover:text-[#f7f3ea]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default AnnouncementBanner;
