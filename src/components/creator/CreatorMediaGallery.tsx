import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { atHandle, socialUrl } from "@/lib/socialHandles";
import { Film, ExternalLink, Instagram, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  media_type: string;
  source: string;
  url: string;
  thumbnail_url: string | null;
  external_url: string | null;
  caption: string | null;
  is_cover: boolean;
}

interface CreatorMediaGalleryProps {
  creatorId: string;
  fallbackPhotos?: string[] | null;
  instagramHandle?: string | null;
  isOwnProfile?: boolean;
  hideTitle?: boolean;
  useIgGrid?: boolean;
}

export function CreatorMediaGallery({
  creatorId,
  fallbackPhotos,
  instagramHandle,
  isOwnProfile,
  hideTitle,
}: CreatorMediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const highlightInput = useRef<HTMLInputElement>(null);
  const [uploadingHighlight, setUploadingHighlight] = useState(false);
  const uploadHighlight = async (file: File) => {
    if (!creatorId) return;
    setUploadingHighlight(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const isVideo = file.type.startsWith("video/");
      const path = `${creatorId}/highlights/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { data: row, error: insErr } = await supabase
        .from("creator_media")
        .insert({
          user_id: creatorId,
          url: pub.publicUrl,
          media_type: isVideo ? "video" : "image",
          source: "upload",
          sort_order: items.length,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      setItems((prev) => [...prev, row as any]);
    } catch (e) {
      console.error("highlight upload failed", e);
      alert((e as any)?.message || "Upload failed");
    } finally {
      setUploadingHighlight(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("creator_media")
        .select("id, media_type, source, url, thumbnail_url, external_url, caption, is_cover")
        .eq("user_id", creatorId)
        .order("sort_order", { ascending: true });
      setItems((data as MediaItem[]) || []);
      setLoading(false);
    })();
  }, [creatorId]);

  if (loading) return null;

  // Fall back to featured_photos
  if (items.length === 0 && fallbackPhotos && fallbackPhotos.length > 0) {
    return (
      <section>
        {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">My Top Trip Highlights</h2>}
        <ScrollCarousel>
          {fallbackPhotos.map((src) => (
            <img key={src} src={src} alt="Content" className="h-80 md:h-96 w-auto object-cover rounded-2xl flex-shrink-0" loading="lazy" />
          ))}
        </ScrollCarousel>
      </section>
    );
  }

  // Empty states
  if (items.length === 0) {
    if (isOwnProfile) {
      return (
        <section>
          {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">My Top Trip Highlights</h2>}
          <div className="rounded-xl border border-dashed border-[#E5DFC6] bg-white/50 p-8 text-center">
            <Instagram className="h-6 w-6 text-[#C7A962] mx-auto mb-3" />
            <p className="text-sm text-[#0a2225] mb-1">Add trip highlights</p>
            <p className="text-xs text-[#6B7280] mb-4">
              Upload photos, videos, or link your Instagram and TikTok reels.
            </p>
            <input ref={highlightInput} type="file" accept="image/*,video/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadHighlight(e.target.files[0])} />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingHighlight}
              onClick={() => highlightInput.current?.click()}
              className="border-[#E5DFC6] text-[#0a2225]"
            >
              {uploadingHighlight ? "Uploading…" : "Upload photo or video"}
            </Button>
          </div>
        </section>
      );
    }

    if (!instagramHandle) return null;

    return (
      <section>
        {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">My Top Trip Highlights</h2>}
        <div className="rounded-xl border border-[#E5DFC6] bg-white p-6 text-center">
          <p className="text-sm text-[#6B7280]">
            Follow{" "}
            <a
              href={socialUrl("instagram", instagramHandle) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#0c4d47] hover:underline"
            >
              {atHandle(instagramHandle)}
            </a>{" "}
            on Instagram
          </p>
        </div>
      </section>
    );
  }

  // Horizontal auto-scroll carousel
  return (
    <section>
      {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">My Top Trip Highlights</h2>}
      <ScrollCarousel>
        {items.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden bg-[#E5DFC6]/30 cursor-pointer group rounded-2xl flex-shrink-0 h-80 md:h-96"
            onClick={() => {
              if (item.media_type === "video") {
                if (item.external_url) {
                  window.open(item.external_url, "_blank", "noopener");
                } else {
                  setPlayingVideo(playingVideo === item.id ? null : item.id);
                }
              }
            }}
          >
            {/* Image */}
            {item.media_type === "image" && (
              <>
                <img
                  src={item.url}
                  alt={item.caption || "Photo"}
                  className="h-full w-auto object-cover"
                  loading="lazy"
                />
                {item.is_cover && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#C7A962] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase">
                    <Star className="w-3 h-3" /> Cover
                  </span>
                )}
                {item.caption && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                  </div>
                )}
              </>
            )}

            {/* Video — playing */}
            {item.media_type === "video" && item.source === "upload" && playingVideo === item.id && (
              <video src={item.url} className="h-full w-auto object-cover" controls autoPlay playsInline />
            )}

            {/* Video — thumbnail */}
            {item.media_type === "video" && !(item.source === "upload" && playingVideo === item.id) && (
              <>
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.source} className="h-full w-auto object-cover" loading="lazy" />
                ) : item.source === "upload" ? (
                  <video src={item.url} className="h-full w-auto object-cover" muted preload="metadata" />
                ) : (
                  <div className="h-full aspect-square flex flex-col items-center justify-center gap-2 bg-[#FDF9F0]">
                    <Film className="w-8 h-8 text-[#C7A962]" />
                    <span className="text-xs font-medium text-[#7A7151] uppercase tracking-wide">
                      {item.source === "instagram" ? "Instagram" : "TikTok"} Reel
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.external_url ? (
                    <ExternalLink className="w-5 h-5 text-white drop-shadow-lg" />
                  ) : (
                    <Film className="w-6 h-6 text-white drop-shadow-lg" />
                  )}
                </div>
              </>
            )}

            {/* Source badge for social content */}
            {item.source !== "upload" && (
              <span className="absolute top-2 left-2 text-[9px] bg-black/50 text-white px-2 py-0.5 rounded-full uppercase font-medium">
                {item.source}
              </span>
            )}
          </div>
        ))}
      </ScrollCarousel>
    </section>
  );
}

/* Reusable horizontal auto-scroll carousel wrapper */
function ScrollCarousel({ children }: { children: React.ReactNode }) {
  const speed = 40; // seconds for one full cycle

  return (
    <div className="relative group/carousel">
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-[#FDF9F0] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#FDF9F0] to-transparent" />

      {/* Scrolling track */}
      <div className="overflow-hidden">
        <div
          className="flex gap-4 w-max animate-scroll-left hover:[animation-play-state:paused]"
          style={{ animationDuration: `${speed}s` }}
        >
          {children}
          {children}
        </div>
      </div>
    </div>
  );
}
