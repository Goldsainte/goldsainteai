import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorMediaUploader, type MediaEntry } from "@/components/creator/CreatorMediaUploader";
import { CreatorSocialAccountsEditor, type SocialAccount } from "@/components/creator/CreatorSocialAccountsEditor";

export function CreatorPortfolioTab() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [socials, setSocials] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [originalMediaIds, setOriginalMediaIds] = useState<string[]>([]);
  const [originalSocialIds, setOriginalSocialIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  // Warn before leaving the page with unsaved uploads/edits — uploading
  // alone only stages changes locally; nothing persists until "Save
  // Portfolio" is clicked, so a stray refresh or navigation silently
  // discards everything without this.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [mediaRes, socialsRes] = await Promise.all([
        supabase
          .from("creator_media")
          .select("*")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("creator_social_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
      ]);

      if (mediaRes.data) {
        const entries: MediaEntry[] = mediaRes.data.map((m: any) => ({
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
        setOriginalMediaIds(entries.map((e) => e.id!).filter(Boolean));
      }

      if (socialsRes.data) {
        const entries: SocialAccount[] = socialsRes.data.map((s: any) => ({
          id: s.id,
          platform: s.platform,
          handle: s.handle,
          profile_url: s.profile_url,
          followers_count: s.followers_count,
          sort_order: s.sort_order,
        }));
        setSocials(entries);
        setOriginalSocialIds(entries.map((e) => e.id!).filter(Boolean));
      }

      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // --- Media save ---
      const currentMediaIds = media.map((m) => m.id).filter(Boolean) as string[];
      const deletedMediaIds = originalMediaIds.filter((id) => !currentMediaIds.includes(id));
      if (deletedMediaIds.length > 0) {
        await supabase.from("creator_media").delete().in("id", deletedMediaIds);
      }
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

      // Cover image sync
      const coverPhoto = media.find((m) => m.media_type === "image" && m.is_cover);
      if (coverPhoto) {
        await supabase.from("profiles").update({ cover_image_url: coverPhoto.url }).eq("id", user.id);
      }

      // --- Social accounts save ---
      const currentSocialIds = socials.map((s) => s.id).filter(Boolean) as string[];
      const deletedSocialIds = originalSocialIds.filter((id) => !currentSocialIds.includes(id));
      if (deletedSocialIds.length > 0) {
        await supabase.from("creator_social_accounts").delete().in("id", deletedSocialIds);
      }
      if (socials.length > 0) {
        const socialRows = socials.map((item, idx) => ({
          id: item.id || crypto.randomUUID(),
          user_id: user.id,
          platform: item.platform,
          handle: item.handle,
          profile_url: item.profile_url,
          followers_count: item.followers_count,
          sort_order: idx,
        }));
        const { error } = await supabase
          .from("creator_social_accounts")
          .upsert(socialRows, { onConflict: "id" });
        if (error) throw error;
      }

      // Refresh IDs
      const [mediaRefresh, socialRefresh] = await Promise.all([
        supabase.from("creator_media").select("id").eq("user_id", user.id),
        supabase.from("creator_social_accounts").select("id").eq("user_id", user.id),
      ]);
      setOriginalMediaIds((mediaRefresh.data || []).map((r: any) => r.id));
      setOriginalSocialIds((socialRefresh.data || []).map((r: any) => r.id));

      toast.success("Portfolio saved");
      setDirty(false);
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
        <h3 className="font-secondary text-lg md:text-xl text-[#0a2225] mb-1">Trip Highlights</h3>
        <p className="text-[15px] text-[#6B7280] mb-2">
          Featured content shown at the top of your public profile — photos, videos, and Instagram or TikTok reels. Set any photo as your cover image.
        </p>
        <button
          type="button"
          onClick={() => (window.location.href = "/profile/media")}
          className="mb-4 inline-flex items-center gap-1.5 text-[15px] text-[#8D6B2F] transition-colors hover:text-[#0a2225]"
        >
          Managing your main gallery? Photos & video →
        </button>
        <CreatorMediaUploader
          userId={user?.id || ""}
          media={media}
          onMediaChange={(m) => { setMedia(m); setDirty(true); }}
          maxItems={12}
        />
      </div>

      {/* Social Accounts */}
      <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
        <h3 className="font-secondary text-lg md:text-xl text-[#0a2225] mb-1">Social Accounts</h3>
        <p className="text-[15px] text-[#6B7280] mb-4">
          Add your social profiles and follower counts. This builds credibility and helps travelers trust your expertise.
        </p>
        <CreatorSocialAccountsEditor accounts={socials} onChange={(s) => { setSocials(s); setDirty(true); }} />
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {dirty && (
          <p className="text-[13px] text-[#C7A962] font-medium">
            Unsaved changes — click Save Portfolio or they'll be lost
          </p>
        )}
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
