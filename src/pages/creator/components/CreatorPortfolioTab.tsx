import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorMediaUploader, type MediaEntry } from "@/components/creator/CreatorMediaUploader";

export function CreatorPortfolioTab() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Track original IDs to detect deletions
  const [originalIds, setOriginalIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Load existing media
      const { data: mediaData } = await supabase
        .from("creator_media")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (mediaData) {
        const entries: MediaEntry[] = mediaData.map((m: any) => ({
          id: m.id,
          media_type: m.media_type as "image" | "video",
          source: m.source as "upload" | "instagram" | "tiktok",
          url: m.url,
          thumbnail_url: m.thumbnail_url,
          external_url: m.external_url,
          caption: m.caption,
        }));
        setMedia(entries);
        setOriginalIds(entries.map((e) => e.id!).filter(Boolean));
      }

      // Load cover image
      const { data: profile } = await supabase
        .from("profiles")
        .select("cover_image_url")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) setCoverImage(profile.cover_image_url);

      setLoading(false);
    })();
  }, [user]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/cover/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ cover_image_url: publicUrl }).eq("id", user.id);
      setCoverImage(publicUrl);
      toast.success("Cover image updated");
    } catch {
      toast.error("Failed to upload cover image");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Delete removed items
      const currentIds = media.map((m) => m.id).filter(Boolean) as string[];
      const deletedIds = originalIds.filter((id) => !currentIds.includes(id));
      if (deletedIds.length > 0) {
        await supabase.from("creator_media").delete().in("id", deletedIds);
      }

      // Upsert current items
      if (media.length > 0) {
        const rows = media.map((item, idx) => ({
          ...(item.id ? { id: item.id } : {}),
          user_id: user.id,
          media_type: item.media_type,
          source: item.source,
          url: item.url,
          thumbnail_url: item.thumbnail_url || null,
          external_url: item.external_url || null,
          caption: item.caption || null,
          sort_order: idx,
        }));
        const { error } = await supabase.from("creator_media").upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }

      // Refresh IDs
      const { data: refreshed } = await supabase
        .from("creator_media")
        .select("id")
        .eq("user_id", user.id);
      setOriginalIds((refreshed || []).map((r: any) => r.id));

      toast.success("Portfolio saved");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save portfolio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
        <h3 className="text-sm font-semibold text-[#0a2225] mb-4">Cover Image</h3>
        <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-[#E5DFC6] bg-[#F5F0E0]">
          {coverImage ? (
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#6B7280] text-sm">
              No cover image set
            </div>
          )}
          <label className="absolute bottom-3 right-3 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
              disabled={uploadingCover}
            />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-[#0a2225] shadow-sm hover:bg-white transition-colors">
              {uploadingCover ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {coverImage ? "Change" : "Upload"}
            </span>
          </label>
        </div>
      </div>

      {/* Media Gallery */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
        <h3 className="text-sm font-semibold text-[#0a2225] mb-1">Photos, Videos & Reels</h3>
        <p className="text-xs text-[#6B7280] mb-4">
          Showcase your best travel content. Upload photos and videos, or paste Instagram and TikTok Reel links.
        </p>
        <CreatorMediaUploader
          userId={user?.id || ""}
          media={media}
          onMediaChange={setMedia}
          maxItems={12}
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-xl px-8"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Portfolio
        </Button>
      </div>
    </div>
  );
}
