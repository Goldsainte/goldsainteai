import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public gallery + video for agents and creators, fed by /profile/media
 * (partner_media table). Renders nothing at all until the partner has
 * saved media — zero footprint on profiles that haven't.
 */
export function PartnerMediaGallery({ userId }: { userId: string }) {
  const [gallery, setGallery] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

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

  return (
    <section className="mt-10">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Gallery</p>
      <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#0a2225]">
        Photos & video
      </h2>

      {gallery.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="h-40 w-full rounded-xl object-cover shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
            />
          ))}
        </div>
      )}

      {embedUrl ? (
        <div className="mt-5 overflow-hidden rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
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
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-6 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
        >
          Watch video →
        </a>
      ) : null}
    </section>
  );
}
