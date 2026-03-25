import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, Film, Image as ImageIcon, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isVideo && !isImage) {
          toast.error(`${file.name} is not a supported format`);
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
          media_type: isVideo ? "video" : "image",
          source: "upload",
          url: publicUrl,
        });
      }

      if (newItems.length > 0) {
        onMediaChange([...media, ...newItems]);
        toast.success(`${newItems.length} file(s) uploaded`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const [isAddingLink, setIsAddingLink] = useState(false);

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
      const { data } = await supabase.functions.invoke("fetch-social-thumbnail", {
        body: { url },
      });
      thumbnail_url = data?.thumbnail_url || null;
    } catch {
      // graceful fallback
    }

    const entry: MediaEntry = {
      media_type: "video",
      source: isInstagram ? "instagram" : "tiktok",
      url: url,
      external_url: url,
      thumbnail_url,
    };

    onMediaChange([...media, entry]);
    setLinkUrl("");
    setShowLinkInput(false);
    setIsAddingLink(false);
    toast.success(`${isInstagram ? "Instagram" : "TikTok"} link added`);
  };

  const removeItem = (index: number) => {
    onMediaChange(media.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {media.map((item, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border border-[#E5DFC6] group bg-[#FDF9F0]"
          >
            {item.source === "upload" && item.media_type === "image" ? (
              <img src={item.url} alt="Media" className="w-full h-full object-cover" />
            ) : item.source === "upload" && item.media_type === "video" ? (
              <div className="w-full h-full flex items-center justify-center bg-black/5">
                <video src={item.url} className="w-full h-full object-cover" muted />
                <Film className="absolute w-6 h-6 text-white drop-shadow-lg" />
              </div>
            ) : item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt={item.source} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                <Film className="w-8 h-8 text-[#C7A962]" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-[#7A7151]">
                  {item.source}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Source badge */}
            {item.source !== "upload" && (
              <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full uppercase font-medium">
                {item.source}
              </span>
            )}
            {item.media_type === "video" && item.source === "upload" && (
              <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full uppercase font-medium">
                Video
              </span>
            )}
          </div>
        ))}

        {media.length < maxItems && (
          <label
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="file"
              accept="image/*,video/mp4,video/quicktime,video/webm"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-[#C7A962] animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-[#C7A962]" />
                <span className="text-xs text-[#6B7280]">Upload</span>
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

      <p className="text-xs text-[#6B7280] text-center">
        {media.length}/{maxItems} items • Photos, videos, or social media links
      </p>
    </div>
  );
}
