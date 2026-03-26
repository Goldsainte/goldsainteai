import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, Film, Image as ImageIcon, Link2, Star, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CreatorMediaUploaderProps {
  userId: string;
  media: MediaEntry[];
  onMediaChange: (media: MediaEntry[]) => void;
  maxItems?: number;
}

export interface MediaEntry {
  id?: string;
  media_type: "image" | "video";
  source: "upload" | "instagram" | "tiktok";
  url: string;
  thumbnail_url?: string | null;
  external_url?: string | null;
  caption?: string | null;
  is_cover?: boolean;
}

export function CreatorMediaUploader({
  userId,
  media,
  onMediaChange,
  maxItems = 12,
}: CreatorMediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [thumbnailUploadingIdx, setThumbnailUploadingIdx] = useState<number | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [pendingThumbnailIdx, setPendingThumbnailIdx] = useState<number | null>(null);

  const photos = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (media.length + files.length > maxItems) {
      toast.error(`Maximum ${maxItems} items allowed`);
      return;
    }

    setIsUploading(true);
    const newItems: MediaEntry[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isCorrectType = type === "image" ? file.type.startsWith("image/") : file.type.startsWith("video/");
        if (!isCorrectType) {
          toast.error(`${file.name} is not a supported ${type} format`);
          continue;
        }
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 50MB)`);
          continue;
        }

        const ext = file.name.split(".").pop();
        const path = `${userId}/media/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
        if (error) { console.error("Upload error:", error); continue; }

        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        newItems.push({
          media_type: type,
          source: "upload",
          url: publicUrl,
          is_cover: false,
        });
      }

      if (newItems.length > 0) {
        onMediaChange([...media, ...newItems]);
        toast.success(`${newItems.length} ${type}(s) uploaded`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim();
    const isInstagram = url.includes("instagram.com");
    const isTikTok = url.includes("tiktok.com");

    if (!isInstagram && !isTikTok) {
      toast.error("Please paste an Instagram or TikTok link");
      return;
    }
    if (media.length >= maxItems) {
      toast.error(`Maximum ${maxItems} items allowed`);
      return;
    }

    setIsAddingLink(true);
    let thumbnail_url: string | null = null;
    try {
      const { data } = await supabase.functions.invoke("fetch-social-thumbnail", { body: { url } });
      thumbnail_url = data?.thumbnail_url || null;
    } catch { /* graceful fallback */ }

    const entry: MediaEntry = {
      media_type: "video",
      source: isInstagram ? "instagram" : "tiktok",
      url,
      external_url: url,
      thumbnail_url,
      is_cover: false,
    };

    onMediaChange([...media, entry]);
    setLinkUrl("");
    setShowLinkInput(false);
    setIsAddingLink(false);
    toast.success(`${isInstagram ? "Instagram" : "TikTok"} link added`);
  };

  const removeItem = (globalIndex: number) => {
    onMediaChange(media.filter((_, i) => i !== globalIndex));
  };

  const getGlobalIndex = (item: MediaEntry) => media.indexOf(item);

  const setAsCover = (item: MediaEntry) => {
    const updated = media.map((m) => ({
      ...m,
      is_cover: m === item ? true : m.media_type === "image" ? false : m.is_cover,
    }));
    onMediaChange(updated);
    toast.success("Cover image set");
  };

  const handleChangeThumbnail = (globalIdx: number) => {
    setPendingThumbnailIdx(globalIdx);
    thumbnailInputRef.current?.click();
  };

  const handleThumbnailFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || pendingThumbnailIdx === null) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setThumbnailUploadingIdx(pendingThumbnailIdx);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/thumbnails/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

      const updated = [...media];
      updated[pendingThumbnailIdx] = { ...updated[pendingThumbnailIdx], thumbnail_url: publicUrl };
      onMediaChange(updated);
      toast.success("Video thumbnail updated");
    } catch {
      toast.error("Failed to upload thumbnail");
    } finally {
      setThumbnailUploadingIdx(null);
      setPendingThumbnailIdx(null);
      e.target.value = "";
    }
  };

  const renderPhotoItem = (item: MediaEntry) => {
    const gIdx = getGlobalIndex(item);
    return (
      <div
        key={gIdx}
        className="relative aspect-square rounded-xl overflow-hidden border border-[#E5DFC6] group bg-[#FDF9F0]"
      >
        <img src={item.url} alt="Photo" className="w-full h-full object-cover" />

        {/* Cover badge */}
        {item.is_cover && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#C7A962] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase">
            <Star className="w-3 h-3" /> Cover
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {!item.is_cover && (
            <button
              type="button"
              onClick={() => setAsCover(item)}
              className="bg-white/90 text-[#0a2225] text-[10px] font-medium px-2.5 py-1 rounded-full hover:bg-white transition-colors"
            >
              <Star className="w-3 h-3 inline mr-1" />
              Set Cover
            </button>
          )}
          <button
            type="button"
            onClick={() => removeItem(gIdx)}
            className="w-7 h-7 bg-red-500/90 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  };

  const renderVideoItem = (item: MediaEntry) => {
    const gIdx = getGlobalIndex(item);
    const isUploadingThumb = thumbnailUploadingIdx === gIdx;

    return (
      <div
        key={gIdx}
        className="relative aspect-square rounded-xl overflow-hidden border border-[#E5DFC6] group bg-[#FDF9F0]"
      >
        {item.source === "upload" ? (
          item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="Video thumbnail" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full relative">
              <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Film className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
            </div>
          )
        ) : item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.source} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
            <Film className="w-8 h-8 text-[#C7A962]" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#7A7151]">{item.source}</span>
          </div>
        )}

        {/* Source badge */}
        {item.source !== "upload" && (
          <span className="absolute top-2 left-2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full uppercase font-medium">
            {item.source}
          </span>
        )}
        {item.source === "upload" && (
          <span className="absolute top-2 left-2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full uppercase font-medium">
            Video
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleChangeThumbnail(gIdx)}
            disabled={isUploadingThumb}
            className="bg-white/90 text-[#0a2225] text-[10px] font-medium px-2.5 py-1 rounded-full hover:bg-white transition-colors"
          >
            {isUploadingThumb ? (
              <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
            ) : (
              <ImagePlus className="w-3 h-3 inline mr-1" />
            )}
            Thumbnail
          </button>
          <button
            type="button"
            onClick={() => removeItem(gIdx)}
            className="w-7 h-7 bg-red-500/90 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Hidden thumbnail file input */}
      <input
        ref={thumbnailInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleThumbnailFileSelected}
      />

      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-[#F5F0E0] rounded-xl">
          <TabsTrigger value="photos" className="rounded-lg data-[state=active]:bg-white text-sm">
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Photos ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-lg data-[state=active]:bg-white text-sm">
            <Film className="w-4 h-4 mr-1.5" />
            Videos ({videos.length})
          </TabsTrigger>
        </TabsList>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {photos.map(renderPhotoItem)}

            {media.length < maxItems && (
              <label
                className={cn(
                  "aspect-square rounded-xl border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
                  isUploading && "pointer-events-none opacity-50"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, "image")}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-[#C7A962] animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[#C7A962]" />
                    <span className="text-xs text-[#6B7280]">Upload Photos</span>
                  </>
                )}
              </label>
            )}
          </div>

          {photos.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#E5DFC6] bg-[#F5F0E0]/30 p-6 text-center">
              <ImageIcon className="h-8 w-8 text-[#C7A962] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No photos yet. Upload images to showcase your travel experiences.</p>
            </div>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {videos.map(renderVideoItem)}

            {media.length < maxItems && (
              <label
                className={cn(
                  "aspect-square rounded-xl border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
                  isUploading && "pointer-events-none opacity-50"
                )}
              >
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  multiple
                  onChange={(e) => handleFileUpload(e, "video")}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-[#C7A962] animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[#C7A962]" />
                    <span className="text-xs text-[#6B7280]">Upload Videos</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Add social link */}
          {showLinkInput ? (
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Paste Instagram or TikTok Reel URL..."
                className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddLink}
                disabled={isAddingLink}
                className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-xl shrink-0"
              >
                {isAddingLink ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
                className="text-[#6B7280] shrink-0"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLinkInput(true)}
              className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#FDF9F0] rounded-xl"
            >
              <Link2 className="w-4 h-4 mr-1.5" />
              Add Instagram / TikTok Link
            </Button>
          )}

          {videos.length === 0 && !showLinkInput && (
            <div className="rounded-xl border border-dashed border-[#E5DFC6] bg-[#F5F0E0]/30 p-6 text-center">
              <Film className="h-8 w-8 text-[#C7A962] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No videos yet. Upload videos or add social media links.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-[#6B7280] text-center">
        {media.length}/{maxItems} items • {photos.length} photos, {videos.length} videos
      </p>
    </div>
  );
}
