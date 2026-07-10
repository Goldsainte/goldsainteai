import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public gallery + video for agents and creators, fed by /profile/media
 * (partner_media table). Renders nothing at all until the partner has
 * saved media — zero footprint on profiles that haven't.
 *
 * Layout: "The Collage" (founder-approved Jul 10) — one hero photo
 * anchoring a tight grid, the film as its own tile with a play badge,
 * and a champagne "View all" pill opening a full-screen lightbox.
 * Always at most two rows tall regardless of how many photos exist.
 */

type Item = { type: "photo"; url: string } | { type: "video" };

export function PartnerMediaGallery({ userId }: { userId: string }) {
  const [gallery, setGallery] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [focusVideo, setFocusVideo] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("partner_media")
          .select("gallery_urls, video_url")
          .eq("user_id", userId)
          .maybeSingle();
        if (!alive || !data) return;
        setGallery(Array.isArray(data.gallery_urls) ? data.gallery_urls : []);
        setVideoUrl(data.video_url ?? null);
      } catch (e) {
        console.error("Partner media load failed (non-fatal):", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  // Lightbox: Esc closes, body scroll locks while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (gallery.length === 0 && !videoUrl) return null;

  // YouTube / Vimeo → embeddable URL (both are allowlisted in the CSP)
  const embedUrl = (() => {
    if (!videoUrl) return null;
    const yt = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/
    );
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  })();

  const items: Item[] = gallery.map((url) => ({ type: "photo", url }));
  if (videoUrl) items.push({ type: "video" });

  const openLightbox = (video = false) => {
    setFocusVideo(video);
    setOpen(true);
  };

  const photoTile = (url: string, className = "") => (
    <button
      key={url}
      type="button"
      onClick={() => openLightbox(false)}
      className={`group relative block h-full w-full overflow-hidden ${className}`}
    >
      <img
        src={url}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    </button>
  );

  const videoTile = (className = "") => (
    <button
      key="video-tile"
      type="button"
      onClick={() => openLightbox(true)}
      className={`flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-[#0a2225] to-[#0c4d47] ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C7A962] bg-[#0a2225]/40 backdrop-blur-sm">
        <span className="ml-1 block h-0 w-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-[#E5DFC6]" />
      </span>
      <span className="text-[10px] uppercase tracking-[0.24em] text-[#E5DFC6]">
        Introduction film
      </span>
    </button>
  );

  const tile = (it: Item, className = "") =>
    it.type === "photo" ? photoTile(it.url, className) : videoTile(className);

  const viewAllPill = gallery.length > 0 && (
    <button
      type="button"
      onClick={() => openLightbox(false)}
      className="absolute bottom-3.5 right-3.5 inline-flex items-center rounded-full border border-[#E5DFC6] bg-[#fdfaf2]/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a2225] shadow-[0_2px_16px_rgba(0,0,0,0.12)] backdrop-blur transition-colors hover:bg-[#fdfaf2]"
    >
      View all {gallery.length} {gallery.length === 1 ? "photo" : "photos"}
    </button>
  );

  const embedBlock = embedUrl ? (
    <div className="overflow-hidden rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
      <iframe
        src={embedUrl}
        title="Introduction video"
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  ) : videoUrl ? (
    <a
      href={videoUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-6 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
    >
      Watch video →
    </a>
  ) : null;

  // ── Collage variants by item count (photos always lead; film takes the last tile) ──
  let collage: JSX.Element;
  if (gallery.length === 0) {
    // Video only — a single contained embed, no collage
    collage = <div className="mt-5">{embedBlock}</div>;
  } else if (items.length === 1) {
    collage = (
      <div className="relative mt-5 overflow-hidden rounded-2xl">
        {tile(items[0], "h-[300px] md:h-[380px]")}
      </div>
    );
  } else if (items.length === 2) {
    collage = (
      <div className="relative mt-5 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
        {tile(items[0], "h-[220px] md:h-[300px]")}
        {tile(items[1], "h-[220px] md:h-[300px]")}
        {viewAllPill}
      </div>
    );
  } else if (items.length <= 4) {
    collage = (
      <div className="relative mt-5 grid grid-cols-2 grid-rows-[170px_110px] gap-2 overflow-hidden rounded-2xl md:grid-cols-[1.6fr_1fr] md:grid-rows-[190px_190px]">
        {tile(items[0], "col-span-2 md:col-span-1 md:row-span-2")}
        {tile(items[1])}
        {tile(items[2])}
        {viewAllPill}
      </div>
    );
  } else {
    collage = (
      <div className="relative mt-5 grid grid-cols-2 grid-rows-[170px_110px] gap-2 overflow-hidden rounded-2xl md:grid-cols-[1.6fr_1fr_1fr] md:grid-rows-[190px_190px]">
        {tile(items[0], "col-span-2 md:col-span-1 md:row-span-2")}
        {tile(items[1])}
        {tile(items[2])}
        {tile(items[3], "hidden md:block")}
        {tile(items[4], "hidden md:block")}
        {viewAllPill}
      </div>
    );
  }

  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Gallery</p>
      <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#0a2225]">
        Photos & video
      </h2>

      {collage}

      {/* ── Lightbox ── */}
      {open && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0a2225]/95 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962]">Gallery</p>
                <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#fdfaf2]">
                  Photos & video
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0a2225]/70 text-[#E5DFC6] backdrop-blur transition-colors hover:bg-[#0a2225]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {focusVideo && embedBlock && <div className="mt-8">{embedBlock}</div>}

            {gallery.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {gallery.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    loading="lazy"
                    className="w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}

            {!focusVideo && embedBlock && <div className="mt-8">{embedBlock}</div>}
          </div>
        </div>
      )}
    </section>
  );
}
