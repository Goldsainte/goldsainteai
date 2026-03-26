import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Film, ExternalLink, Instagram, Star } from "lucide-react";
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
  useIgGrid,
}: CreatorMediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

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
        {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">From My Travels</h2>}
        <div className={useIgGrid ? "grid grid-cols-3 gap-1" : "columns-2 md:columns-3 gap-3 space-y-3"}>
          {fallbackPhotos.map((src) => (
            <img key={src} src={src} alt="Content" className={`w-full object-cover ${useIgGrid ? "aspect-square" : "rounded-xl"}`} loading="lazy" />
          ))}
        </div>
      </section>
    );
  }

  // Empty states
  if (items.length === 0) {
    if (isOwnProfile) {
      return (
        <section>
          {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">From My Travels</h2>}
          <div className="rounded-xl border border-dashed border-[#E5DFC6] bg-white/50 p-8 text-center">
            <Instagram className="h-6 w-6 text-[#C7A962] mx-auto mb-3" />
            <p className="text-sm text-[#0a2225] mb-1">Add your content</p>
            <p className="text-xs text-[#6B7280] mb-4">
              Upload photos, videos, or link your Instagram and TikTok reels.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/creator-dashboard?tab=portfolio"}
              className="border-[#E5DFC6] text-[#0a2225]"
            >
              Go to Portfolio
            </Button>
          </div>
        </section>
      );
    }

    if (!instagramHandle) return null;

    return (
      <section>
          {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">From My Travels</h2>}
        <div className="rounded-xl border border-[#E5DFC6] bg-white p-6 text-center">
          <p className="text-sm text-[#6B7280]">
            Follow{" "}
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#0c4d47] hover:underline"
            >
              @{instagramHandle}
            </a>{" "}
            on Instagram
          </p>
        </div>
      </section>
    );
  }

  // Unified masonry grid — all media combined
  return (
    <section>
      {!hideTitle && <h2 className="font-secondary text-xl text-[#0a2225] mb-5">From My Travels</h2>}
      <div className={useIgGrid ? "grid grid-cols-3 gap-1" : "columns-2 md:columns-3 gap-3 space-y-3"}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden bg-[#E5DFC6]/30 cursor-pointer group ${useIgGrid ? "aspect-square" : "rounded-xl break-inside-avoid"}`}
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
                  className={`w-full object-cover ${useIgGrid ? "h-full" : ""}`}
                  loading="lazy"
                />
                {item.is_cover && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#C7A962] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase">
                    <Star className="w-3 h-3" /> Cover
                  </span>
                )}
              </>
            )}

            {/* Video — playing */}
            {item.media_type === "video" && item.source === "upload" && playingVideo === item.id && (
              <video src={item.url} className="w-full object-cover" controls autoPlay playsInline />
            )}

            {/* Video — thumbnail */}
            {item.media_type === "video" && !(item.source === "upload" && playingVideo === item.id) && (
              <>
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.source} className="w-full object-cover" loading="lazy" />
                ) : item.source === "upload" ? (
                  <video src={item.url} className="w-full object-cover" muted preload="metadata" />
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center gap-2 bg-[#FDF9F0]">
                    <Film className="w-8 h-8 text-[#C7A962]" />
                    <span className="text-xs font-medium text-[#7A7151] uppercase tracking-wide">
                      {item.source === "instagram" ? "Instagram" : "TikTok"} Reel
                    </span>
                  </div>
                )}
                {/* Play overlay */}
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
      </div>
    </section>
  );
}
