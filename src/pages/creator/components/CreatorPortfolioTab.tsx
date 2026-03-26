import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorMediaUploader, type MediaEntry } from "@/components/creator/CreatorMediaUploader";

export function CreatorPortfolioTab() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Track original IDs to detect deletions
  const [originalIds, setOriginalIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
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
          is_cover: m.is_cover || false,
        }));
        setMedia(entries);
        setOriginalIds(entries.map((e) => e.id!).filter(Boolean));
      }

      setLoading(false);
    })();
  }, [user]);

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
          id: item.id || crypto.randomUUID(),
          user_id: user.id,
          media_type: item.media_type,
          source: item.source,
          url: item.url,
          thumbnail_url: item.thumbnail_url || null,
          external_url: item.external_url || null,
          caption: item.caption || null,
          sort_order: idx,
          is_cover: item.is_cover || false,
        }));
        const { error } = await supabase.from("creator_media").upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }

      // Update cover image on profile from cover photo
      const coverPhoto = media.find((m) => m.media_type === "image" && m.is_cover);
      if (coverPhoto) {
        await supabase.from("profiles").update({ cover_image_url: coverPhoto.url }).eq("id", user.id);
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
      {/* Media Gallery */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
        <h3 className="text-sm font-semibold text-[#0a2225] mb-1">Photos, Videos & Reels</h3>
        <p className="text-xs text-[#6B7280] mb-4">
          Showcase your best travel content. Upload photos and videos, or paste Instagram and TikTok Reel links. Set any photo as your cover image.
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
