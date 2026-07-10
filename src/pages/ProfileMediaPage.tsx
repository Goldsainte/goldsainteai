import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Upload, X } from "lucide-react";
 
const MAX_MB = 15;
 
export default function ProfileMediaPage() {
  const navigate = useNavigate();
  const { isBrand, isAgent, isCreator, loading: roleLoading } = useUserRole();
 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
 
  useEffect(() => {
    if (roleLoading) return;
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth?returnTo=/profile/media", { replace: true });
          return;
        }
        if (!alive) return;
        setUserId(user.id);
 
        if (isBrand) {
          const { data: bp } = await supabase
            .from("brand_profiles")
            .select("id, logo_url, cover_image_url, gallery_urls, video_url")
            .eq("owner_user_id", user.id)
            .maybeSingle();
          if (bp) {
            setBrandProfileId(bp.id);
            setLogoUrl(bp.logo_url ?? null);
            setCoverUrl(bp.cover_image_url ?? null);
            setGalleryUrls(Array.isArray(bp.gallery_urls) ? bp.gallery_urls : []);
            setVideoUrl(bp.video_url ?? "");
          }
        } else {
          const { data: pm } = await supabase
            .from("partner_media")
            .select("cover_url, gallery_urls, video_url")
            .eq("user_id", user.id)
            .maybeSingle();
          if (pm) {
            setCoverUrl(pm.cover_url ?? null);
            setGalleryUrls(Array.isArray(pm.gallery_urls) ? pm.gallery_urls : []);
            setVideoUrl(pm.video_url ?? "");
          }
        }
      } catch (e) {
        console.error("Media load failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [roleLoading, isBrand, navigate]);
 
  async function uploadFiles(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "logo" | "cover" | "gallery",
  ) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || !userId) return;
    const selected =
      kind === "gallery"
        ? files.slice(0, Math.max(0, 12 - galleryUrls.length))
        : files.slice(0, 1);
    if (kind === "gallery" && selected.length < files.length) {
      toast.error("Gallery holds up to 12 images — extra files were skipped.");
    }
    setUploading(true);
    let added: string[] = [];
    for (const file of selected) {
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB — the limit is ${MAX_MB} MB. Skipped.`);
        continue;
      }
      try {
        const ext = file.name.split(".").pop();
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("partner-media")
          .upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("partner-media").getPublicUrl(path);
        if (kind === "logo") setLogoUrl(urlData.publicUrl);
        else if (kind === "cover") setCoverUrl(urlData.publicUrl);
        else added.push(urlData.publicUrl);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Upload failed");
      }
    }
    if (added.length) setGalleryUrls((prev) => [...prev, ...added]);
    setUploading(false);
  }
 
  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      if (isBrand) {
        if (!brandProfileId) {
          toast.error("Your house isn't set up yet — finish your application first.");
          return;
        }
        const { error } = await supabase
          .from("brand_profiles")
          .update({
            logo_url: logoUrl,
            cover_image_url: coverUrl,
            gallery_urls: galleryUrls,
            video_url: videoUrl.trim() || null,
          })
          .eq("id", brandProfileId);
        if (error) throw error;
        toast.success("Saved — your storefront is updated.");
        navigate(`/brands/${brandProfileId}`);
      } else {
        const { error } = await supabase.from("partner_media").upsert({
          user_id: userId,
          cover_url: coverUrl,
          gallery_urls: galleryUrls,
          video_url: videoUrl.trim() || null,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Saved — your profile is updated.");
        if (isAgent) navigate(`/agents/${userId}`);
        else if (isCreator) navigate(`/creators/${userId}`);
      }
    } catch (e: any) {
      console.error("Save failed:", e);
      toast.error(e?.message || "Couldn't save your media");
    } finally {
      setSaving(false);
    }
  }
 
  const removeGallery = (url: string) =>
    setGalleryUrls((prev) => prev.filter((u) => u !== url));
 
  const uploadTile = (kind: "logo" | "cover" | "gallery", label: string, multiple = false) => (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#C7A962]/50 bg-[#fdfaf2] px-6 py-8 text-center transition-colors hover:border-[#C7A962] hover:bg-[#C7A962]/[0.06]">
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-[#C7A962]" />
      ) : (
        <Upload className="h-6 w-6 text-[#C7A962]" />
      )}
      <span className="text-[14px] font-medium text-[#0a2225]">{label}</span>
      <span className="text-[12px] text-[#0a2225]/45">
        JPG, PNG or WebP · up to {MAX_MB} MB{multiple ? " each" : ""}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        multiple={multiple}
        className="hidden"
        disabled={uploading}
        onChange={(e) => uploadFiles(e, kind)}
      />
    </label>
  );
 
  const removeBtn = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a2225]/70 text-[#E5DFC6] backdrop-blur-sm transition-colors hover:bg-[#0a2225]"
      aria-label="Remove"
    >
      <X className="h-4 w-4" />
    </button>
  );
 
  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#0a2225]/55 transition-colors hover:text-[#0a2225]"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
 
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Your profile</p>
        <h1 className="mt-2 font-secondary text-[34px] leading-tight text-[#0a2225]">
          Photos & video
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/55">
          The imagery travelers and specialists see when they find you.
          {isBrand ? " Changes here update your public storefront." : ""}
        </p>
 
        <div className="mt-8 space-y-6">
          {isBrand && (
            <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <h2 className="font-secondary text-[20px] text-[#0a2225]">Logo</h2>
              {logoUrl ? (
                <div className="relative mt-4 inline-block">
                  <img src={logoUrl} alt="Logo" className="h-28 w-28 rounded-xl object-cover" />
                  {removeBtn(() => setLogoUrl(null))}
                </div>
              ) : (
                <div className="mt-4 max-w-xs">{uploadTile("logo", "Upload logo")}</div>
              )}
            </div>
          )}
 
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <h2 className="font-secondary text-[20px] text-[#0a2225]">Cover image</h2>
            {coverUrl ? (
              <div className="relative mt-4">
                <img src={coverUrl} alt="Cover" className="h-52 w-full rounded-xl object-cover" />
                {removeBtn(() => setCoverUrl(null))}
              </div>
            ) : (
              <div className="mt-4">{uploadTile("cover", "Upload cover image")}</div>
            )}
          </div>
 
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <div className="flex items-baseline justify-between">
              <h2 className="font-secondary text-[20px] text-[#0a2225]">Gallery</h2>
              <span className="text-[12px] text-[#0a2225]/45">{galleryUrls.length}/12 images</span>
            </div>
            {galleryUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryUrls.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-32 w-full rounded-xl object-cover" loading="lazy" />
                    {removeBtn(() => removeGallery(url))}
                  </div>
                ))}
              </div>
            )}
            {galleryUrls.length < 12 && (
              <div className="mt-4">{uploadTile("gallery", "Add gallery images", true)}</div>
            )}
          </div>
 
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <h2 className="font-secondary text-[20px] text-[#0a2225]">Video</h2>
            <p className="mt-1.5 text-[13.5px] text-[#0a2225]/55">
              A YouTube or Vimeo link that shows what you do.
            </p>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="mt-4 h-12 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 text-[15px] text-[#0a2225] outline-none transition-colors focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/30"
            />
          </div>
 
          <div className="flex justify-end pb-10">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save media"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
