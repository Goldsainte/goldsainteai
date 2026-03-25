import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Film, ExternalLink } from "lucide-react";

interface MediaItem {
  id: string;
  media_type: string;
  source: string;
  url: string;
  thumbnail_url: string | null;
  external_url: string | null;
  caption: string | null;
}

interface CreatorMediaGalleryProps {
  creatorId: string;
  fallbackPhotos?: string[] | null;
}

export function CreatorMediaGallery({ creatorId, fallbackPhotos }: CreatorMediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("creator_media")
        .select("id, media_type, source, url, thumbnail_url, external_url, caption")
        .eq("user_id", creatorId)
        .order("sort_order", { ascending: true });
      setItems((data as MediaItem[]) || []);
      setLoading(false);
    })();
  }, [creatorId]);

  if (loading) return null;

  // Fall back to featured_photos if no creator_media rows
  if (items.length === 0 && fallbackPhotos && fallbackPhotos.length > 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          Storyboard Preview
        </h2>
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {fallbackPhotos.map((src) => (
            <img key={src} src={src} alt="Storyboard" className="w-full rounded-2xl object-cover" loading="lazy" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
        Content Gallery
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-2xl overflow-hidden bg-black/5 group cursor-pointer"
            onClick={() => {
              if (item.external_url) {
                window.open(item.external_url, "_blank", "noopener");
              } else if (item.media_type === "video") {
                setPlayingVideo(playingVideo === item.id ? null : item.id);
              }
            }}
          >
            {item.media_type === "image" && item.source === "upload" ? (
              <img src={item.url} alt={item.caption || "Content"} className="w-full h-full object-cover" loading="lazy" />
            ) : item.media_type === "video" && item.source === "upload" ? (
              playingVideo === item.id ? (
                <video src={item.url} className="w-full h-full object-cover" controls autoPlay playsInline />
              ) : (
                <div className="w-full h-full relative">
                  <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Film className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
              )
            ) : (
              // External (Instagram/TikTok) link
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#FDF9F0]">
                <Film className="w-10 h-10 text-[#C7A962]" />
                <span className="text-xs font-medium uppercase tracking-wide text-[#7A7151]">
                  {item.source === "instagram" ? "Instagram" : "TikTok"} Reel
                </span>
                <ExternalLink className="w-4 h-4 text-[#6B7280]" />
              </div>
            )}

            {/* Source badge */}
            {item.source !== "upload" && (
              <span className="absolute top-2 left-2 text-[9px] bg-black/60 text-white px-2 py-0.5 rounded-full uppercase font-medium">
                {item.source}
              </span>
            )}
            {item.media_type === "video" && item.source === "upload" && playingVideo !== item.id && (
              <span className="absolute top-2 left-2 text-[9px] bg-black/60 text-white px-2 py-0.5 rounded-full uppercase font-medium">
                Video
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
