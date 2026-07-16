import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, Camera, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WORLD_COUNTRIES } from "@/components/partner/worldCountries";

// ============================================================================
// CreatorSettingsPage (Jul 16 AM) — "Edit public profile" for creators,
// 1:1 in ability with AgentSettingsPage: photo + logo upload (avatars
// bucket), identity, story/travel style, niches/regions/specialties,
// price, socials incl. TikTok. Writes profiles + creator_profiles with
// row-count-verified saves (silent RLS no-ops become loud errors).
// Route: /creator-settings — Header sends creators' Account Settings here.
// ============================================================================

const label = "block text-[15px] font-semibold text-[#0a2225]";
const hint = "mt-1 text-[13px] text-[#6B7280]";
const input =
  "mt-2 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]";

export default function CreatorSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "logo" | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    display_name: "", handle: "", location: "", avatar_url: "",
    bio: "", travel_style: "", primary_niches: "", primary_regions: "",
    specialties: "", starting_price_per_night: "", logo_url: "",
    instagram_handle: "", tiktok_handle: "", website: "",
    linkedin_url: "", facebook_url: "", pinterest_url: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const [visited, setVisited] = useState<string[]>([]);
  const [countryQuery, setCountryQuery] = useState("");
  const toggleCountry = (name: string) =>
    setVisited((v) => (v.includes(name) ? v.filter((x) => x !== name) : [...v, name].sort()));
  const countryMatches = countryQuery.trim()
    ? WORLD_COUNTRIES.filter((c) => c.name.toLowerCase().includes(countryQuery.trim().toLowerCase())).slice(0, 8)
    : [];
  const toArray = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("display_name, full_name, location, avatar_url, instagram_handle").eq("id", user.id).maybeSingle(),
        supabase
          .from("creator_profiles")
          .select(
            "display_name, handle, avatar_url, bio, travel_style, primary_niches, primary_regions, specialties, starting_price_per_night, logo_url, instagram_handle, tiktok_handle, website, linkedin_url, facebook_url, pinterest_url, visited_countries"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setForm({
        display_name: c?.display_name || p?.display_name || p?.full_name || "",
        handle: c?.handle || "",
        location: p?.location || "",
        avatar_url: c?.avatar_url || p?.avatar_url || "",
        bio: c?.bio || "",
        travel_style: c?.travel_style || "",
        primary_niches: (c?.primary_niches || []).join(", "),
        primary_regions: (c?.primary_regions || []).join(", "),
        specialties: (c?.specialties || []).join(", "),
        starting_price_per_night: c?.starting_price_per_night ? String(c.starting_price_per_night) : "",
        logo_url: c?.logo_url || "",
        instagram_handle: c?.instagram_handle || p?.instagram_handle || "",
        tiktok_handle: c?.tiktok_handle || "",
        website: c?.website || "",
        linkedin_url: c?.linkedin_url || "",
        facebook_url: c?.facebook_url || "",
        pinterest_url: c?.pinterest_url || "",
      });
      setVisited(((c as any)?.visited_countries as string[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const uploadImage = async (file: File, kind: "avatar" | "logo") => {
    if (!user) return;
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${kind}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm((f) => ({ ...f, [kind === "avatar" ? "avatar_url" : "logo_url"]: data.publicUrl }));
      toast.success(kind === "avatar" ? "Photo uploaded" : "Logo uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const price = form.starting_price_per_night.trim() ? Number(form.starting_price_per_night) : null;
      if (form.starting_price_per_night.trim() && Number.isNaN(price)) throw new Error("Starting price must be a number");

      const { data: pRows, error: pErr } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name.trim() || null,
          full_name: form.display_name.trim() || null,
          location: form.location.trim() || null,
          avatar_url: form.avatar_url || null,
          instagram_handle: form.instagram_handle.replace(/^@/, "").trim() || null,
        })
        .eq("id", user.id)
        .select("id");
      if (pErr) throw pErr;
      if (!pRows || pRows.length === 0) throw new Error("Your profile row couldn't be updated — nothing was saved.");

      const { data: cRows, error: cErr } = await supabase
        .from("creator_profiles")
        .update({
          display_name: form.display_name.trim() || null,
          handle: form.handle.replace(/^@/, "").trim() || null,
          avatar_url: form.avatar_url || null,
          bio: form.bio.trim() || null,
          travel_style: form.travel_style.trim() || null,
          primary_niches: toArray(form.primary_niches),
          primary_regions: toArray(form.primary_regions),
          specialties: toArray(form.specialties),
          starting_price_per_night: price,
          logo_url: form.logo_url || null,
          instagram_handle: form.instagram_handle.replace(/^@/, "").trim() || null,
          tiktok_handle: form.tiktok_handle.replace(/^@/, "").trim() || null,
          website: form.website.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          facebook_url: form.facebook_url.trim() || null,
          pinterest_url: form.pinterest_url.trim() || null,
          visited_countries: visited,
        })
        .eq("user_id", user.id)
        .select("user_id");
      if (cErr) throw cErr;
      if (!cRows || cRows.length === 0)
        throw new Error("Your creator details couldn't be saved — the database blocked the update (permissions). Run the creators policy SQL (172) and try again.");

      toast.success("Public profile saved");
    } catch (e: any) {
      toast.error(e.message || "Save failed — nothing was changed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FDF9F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet><title>Creator Settings · Goldsainte</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-secondary text-4xl text-[#0a2225]">Creator Settings</h1>
            <p className="mt-2 text-[15px] text-[#0a2225]/70">
              Everything here appears on your public profile — exactly what travelers see.
            </p>
          </div>
          <div className="flex gap-3">
            {user && (
              <button type="button" onClick={() => navigate(`/creators/${user.id}`)}
                className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white">
                <ExternalLink className="h-4 w-4" /> View public profile
              </button>
            )}
            <button type="button" onClick={() => navigate("/agent-guides")}
              className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white">
              Travel guides
            </button>
          </div>
        </div>

        {/* Identity */}
        <section className="mt-10 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">Identity</h2>
          <div className="mt-6 flex flex-wrap items-start gap-8">
            <div className="text-center">
              <input ref={avatarInput} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="h-36 w-28 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-36 w-28 items-center justify-center rounded-2xl bg-[#F5F0E0] font-secondary text-3xl text-[#0c4d47]">
                  {(form.display_name || "C").slice(0, 2).toUpperCase()}
                </div>
              )}
              <button type="button" onClick={() => avatarInput.current?.click()} disabled={uploading === "avatar"}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0c4d47] underline underline-offset-4">
                {uploading === "avatar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                Your photo
              </button>
            </div>
            <div className="text-center">
              <input ref={logoInput} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "logo")} />
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="h-36 w-28 rounded-2xl border border-[#E5DFC6] bg-white object-contain p-2" />
              ) : (
                <div className="flex h-36 w-28 items-center justify-center rounded-2xl border border-dashed border-[#C7B892] bg-white text-[12px] text-[#6B7280]">
                  Brand logo
                </div>
              )}
              <button type="button" onClick={() => logoInput.current?.click()} disabled={uploading === "logo"}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0c4d47] underline underline-offset-4">
                {uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                Brand logo
              </button>
            </div>
            <div className="min-w-[260px] flex-1 space-y-5">
              <div>
                <label className={label}>Your name</label>
                <input className={input} value={form.display_name} onChange={set("display_name")} placeholder="Tommy Chen" />
              </div>
              <div>
                <label className={label}>Handle</label>
                <input className={input} value={form.handle} onChange={set("handle")} placeholder="@tommytravels" />
                <p className={hint}>Your Goldsainte handle — must be unique.</p>
              </div>
              <div>
                <label className={label}>Based in</label>
                <input className={input} value={form.location} onChange={set("location")} placeholder="Charlotte, North Carolina" />
              </div>
              <div>
                <label className={label}>Trips starting at ($/night)</label>
                <input className={input} value={form.starting_price_per_night} onChange={set("starting_price_per_night")} placeholder="300" inputMode="numeric" />
                <p className={hint}>Leave blank to hide this line.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">Your story</h2>
          <div className="mt-6 space-y-6">
            <div>
              <label className={label}>Our story</label>
              <textarea className={`${input} min-h-[120px]`} value={form.bio} onChange={set("bio")} placeholder="Who you are and why you travel, in your voice…" />
            </div>
            <div>
              <label className={label}>Travel style</label>
              <textarea className={`${input} min-h-[120px]`} value={form.travel_style} onChange={set("travel_style")} placeholder="How you like to travel — this also trains your AI guide writer…" />
            </div>
          </div>
        </section>

        {/* Ask us about */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">Ask me about</h2>
          <div className="mt-6 space-y-6">
            <div>
              <label className={label}>Primary niches</label>
              <input className={input} value={form.primary_niches} onChange={set("primary_niches")} placeholder="Couples, Luxury Europe, Honeymoons" />
              <p className={hint}>Separate with commas — these become the tags on your profile and card.</p>
            </div>
            <div>
              <label className={label}>Primary regions</label>
              <input className={input} value={form.primary_regions} onChange={set("primary_regions")} placeholder="Europe, SE Asia, Caribbean" />
            </div>
            <div>
              <label className={label}>Specialties</label>
              <input className={input} value={form.specialties} onChange={set("specialties")} placeholder="Food tours, Photography spots" />
            </div>
          </div>
        </section>

        {/* My travel map */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">My travel map</h2>
          <p className={hint}>
            Add every country you've traveled — they light up gold on your profile map, and your countries count shows on your card.
          </p>
          <input
            className={input}
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            placeholder="Search countries — e.g. Japan"
          />
          {countryMatches.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {countryMatches.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { toggleCountry(c.name); setCountryQuery(""); }}
                  className={`rounded-full px-4 py-2 text-[14px] transition-colors ${
                    visited.includes(c.name)
                      ? "bg-[#0c4d47] text-[#f7f3ea]"
                      : "border border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#C7A962]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          {visited.length > 0 && (
            <>
              <p className="mt-5 text-[15px] font-semibold text-[#0a2225]">
                {visited.length} {visited.length === 1 ? "country" : "countries"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {visited.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleCountry(name)}
                    title="Remove"
                    className="rounded-full bg-[#C7A962]/20 px-4 py-1.5 text-[13px] text-[#0a2225] hover:bg-[#C7A962]/35"
                  >
                    {name} ×
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Stay connected */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">Stay connected</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className={label}>TikTok</label>
              <input className={input} value={form.tiktok_handle} onChange={set("tiktok_handle")} placeholder="@yourhandle" />
            </div>
            <div>
              <label className={label}>Instagram</label>
              <input className={input} value={form.instagram_handle} onChange={set("instagram_handle")} placeholder="@yourhandle" />
            </div>
            <div>
              <label className={label}>Website</label>
              <input className={input} value={form.website} onChange={set("website")} placeholder="https://…" />
            </div>
            <div>
              <label className={label}>LinkedIn</label>
              <input className={input} value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/…" />
            </div>
            <div>
              <label className={label}>Facebook</label>
              <input className={input} value={form.facebook_url} onChange={set("facebook_url")} placeholder="https://facebook.com/…" />
            </div>
            <div>
              <label className={label}>Pinterest</label>
              <input className={input} value={form.pinterest_url} onChange={set("pinterest_url")} placeholder="https://pinterest.com/…" />
            </div>
          </div>
        </section>

        <div className="mt-8 flex justify-end">
          <button type="button" onClick={save} disabled={saving || uploading !== null}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-10 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225] disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save public profile
          </button>
        </div>
      </div>
    </div>
  );
}
