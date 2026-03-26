import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Film, ExternalLink, Instagram, Star, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
}

export function CreatorMediaGallery({
  creatorId,
  fallbackPhotos,
  instagramHandle,
  isOwnProfile,
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

  const photos = items.filter((i) => i.media_type === "image");
  const videos = items.filter((i) => i.media_type === "video");

  // Fall back to featured_photos if no creator_media rows
  if (items.length === 0 && fallbackPhotos && fallbackPhotos.length > 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          Content Gallery
        </h2>
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {fallbackPhotos.map((src) => (
            <img key={src} src={src} alt="Storyboard" className="w-full rounded-2xl object-cover" loading="lazy" />
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (items.length === 0) {
    if (isOwnProfile) {
      return (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
            Content Gallery
          </h2>
          <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-[#F5F0E0]/30 p-8 text-center">
            <Instagram className="h-8 w-8 text-[#C7A962] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0a2225] mb-1">Add your content</p>
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
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          Content Gallery
        </h2>
        <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6 text-center">
          <Instagram className="h-8 w-8 text-[#C7A962] mx-auto mb-3" />
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

  // Determine default tab
  const defaultTab = photos.length > 0 ? "photos" : "videos";

  const renderPhotoGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {photos.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square rounded-2xl overflow-hidden bg-black/5"
        >
          <img src={item.url} alt={item.caption || "Photo"} className="w-full h-full object-cover" loading="lazy" />
          {item.is_cover && (
            <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#C7A962] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase">
              <Star className="w-3 h-3" /> Cover
            </span>
          )}
        </div>
      ))}
    </div>
  );

  const renderVideoGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {videos.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square rounded-2xl overflow-hidden bg-black/5 group cursor-pointer"
          onClick={() => {
            if (item.external_url) {
              window.open(item.external_url, "_blank", "noopener");
            } else {
              setPlayingVideo(playingVideo === item.id ? null : item.id);
            }
          }}
        >
          {item.source === "upload" && playingVideo === item.id ? (
            <video src={item.url} className="w-full h-full object-cover" controls autoPlay playsInline />
          ) : item.thumbnail_url ? (
            <div className="w-full h-full relative">
              <img src={item.thumbnail_url} alt={item.source} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.external_url ? (
                  <ExternalLink className="w-6 h-6 text-white drop-shadow-lg" />
                ) : (
                  <Film className="w-8 h-8 text-white drop-shadow-lg" />
                )}
              </div>
            </div>
          ) : item.source === "upload" ? (
            <div className="w-full h-full relative">
              <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Film className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
          ) : (
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
  );

  // If only one type exists, skip tabs
  const hasPhotos = photos.length > 0;
  const hasVideos = videos.length > 0;

  if (hasPhotos && !hasVideos) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          Content Gallery
        </h2>
        {renderPhotoGrid()}
      </section>
    );
  }

  if (hasVideos && !hasPhotos) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          Content Gallery
        </h2>
        {renderVideoGrid()}
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
        Content Gallery
      </h2>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 bg-[#F5F0E0] rounded-xl">
          <TabsTrigger value="photos" className="rounded-lg data-[state=active]:bg-white text-sm">
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Photos ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-lg data-[state=active]:bg-white text-sm">
            <Film className="w-4 h-4 mr-1.5" />
            Videos ({videos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos">{renderPhotoGrid()}</TabsContent>
        <TabsContent value="videos">{renderVideoGrid()}</TabsContent>
      </Tabs>
    </section>
  );
}
