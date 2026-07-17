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
        // Two sources, newest wins: manual announcements, and press releases
        // published with show_banner = true (the newsroom tie-in).
        const [ann, press] = await Promise.all([
          supabase
            .from("site_announcements" as never)
            .select("id, message, href, created_at")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("press_releases" as never)
            .select("id, title, slug, published_at")
            .eq("published", true)
            .eq("show_banner", true)
            .order("published_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        const a1 = ann.data as unknown as { id: string; message: string; href: string | null; created_at: string } | null;
        const p1 = press.data as unknown as { id: string; title: string; slug: string; published_at: string } | null;
        let row: Announcement | null = null;
        if (a1 && p1) {
          row = new Date(a1.created_at) >= new Date(p1.published_at)
            ? { id: a1.id, message: a1.message, href: a1.href }
            : { id: p1.id, message: p1.title, href: `/newsroom/${p1.slug}` };
        } else if (a1) {
          row = { id: a1.id, message: a1.message, href: a1.href };
        } else if (p1) {
          row = { id: p1.id, message: p1.title, href: `/newsroom/${p1.slug}` };
        }
        if (!row) return;
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
    <div className="relative z-50 flex items-center justify-center gap-2 bg-[#0a2225] px-12 py-2.5">
      <p className="min-w-0 truncate text-[13px] tracking-wide text-[#f7f3ea]">
        {a.message}
      </p>
      <p className="shrink-0 text-[13px]">
        {a.href && (
          <a
            href={a.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="whitespace-nowrap font-medium text-[#C7A962] underline underline-offset-4 hover:text-[#E2C57E]"
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
