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

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const addReelLink = async () => {
    const u = linkUrl.trim();
    const source = u.includes("tiktok.com") ? "tiktok" : u.includes("instagram.com") ? "instagram" : null;
    if (!source) {
      alert("Paste a TikTok or Instagram link (it should contain tiktok.com or instagram.com).");
      return;
    }
    try {
      // Cover image: creator-provided wins; TikTok links can auto-fetch one
      // (Instagram blocks thumbnail access without a registered FB app).
      let thumbnail_url: string | null = null;
      if (coverFile) {
        const ext = (coverFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${creatorId}/highlights/cover-${Date.now()}.${ext}`;
        const { error: cErr } = await supabase.storage.from("avatars").upload(path, coverFile, { cacheControl: "3600" });
        if (cErr) throw cErr;
        thumbnail_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      } else if (source === "tiktok") {
        try {
          const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`);
          if (r.ok) thumbnail_url = (await r.json())?.thumbnail_url ?? null;
        } catch { /* fall back to the branded tile */ }
      }
      const { data: row, error } = await supabase
        .from("creator_media")
        .insert({
          user_id: creatorId,
          media_type: "video",
          source,
          external_url: u,
          url: u,
          thumbnail_url,
          sort_order: items.length,
        })
        .select("*")
        .single();
      if (error) throw error;
      setItems((prev) => [...prev, row as any]);
      setLinkUrl("");
      setCoverFile(null);
      setLinkOpen(false);
    } catch (e) {
      alert((e as any)?.message || "Couldn't add the link");
    }
  };

  const addHighlightControls = (
    <div>
      <input ref={highlightInput} type="file" accept="image/*,video/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && uploadHighlight(e.target.files[0])} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" size="sm" disabled={uploadingHighlight}
          onClick={() => highlightInput.current?.click()}
          className="border-[#E5DFC6] text-[#0a2225]">
          {uploadingHighlight ? "Uploading…" : "Upload photo or video"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLinkOpen((v) => !v)}
          className="border-[#E5DFC6] text-[#0a2225]">
          Link a TikTok / Instagram reel
        </Button>
      </div>
      {linkOpen && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste the reel's link — e.g. https://www.tiktok.com/@you/video/…"
            className="w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-2.5 text-sm text-[#0a2225] outline-none focus:border-[#C7A962]"
          />
          <Button size="sm" onClick={addReelLink} className="bg-[#0c4d47] text-[#f7f3ea] hover:bg-[#0a2225]">
            Add
          </Button>
        </div>
      )}
      {linkOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input ref={coverInput} type="file" accept="image/*" className="hidden"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => coverInput.current?.click()}
            className="text-xs font-medium text-[#0c4d47] underline underline-offset-4">
            {coverFile ? `Cover: ${coverFile.name}` : "Add a cover photo (recommended for Instagram)"}
          </button>
          <span className="text-[11px] text-[#6B7280]">TikTok covers are fetched automatically.</span>
        </div>
      )}
    </div>
  );

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
      {isOwnProfile && <div className="mt-5">{addHighlightControls}</div>}
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
              The photos and short reels travelers see first on your profile. Upload from your device, or paste a link to one of your TikTok or Instagram reels.
            </p>
            {addHighlightControls}
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
            {isOwnProfile && (
              <button
                type="button"
                title="Remove"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm("Remove this highlight?")) return;
                  await supabase.from("creator_media").delete().eq("id", item.id);
                  setItems((prev) => prev.filter((x) => x.id !== item.id));
                }}
                className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}

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
