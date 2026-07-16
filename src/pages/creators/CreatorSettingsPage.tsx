import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, Camera, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WORLD_COUNTRIES } from "@/components/partner/worldCountries";
import { GoogleCityAutocomplete } from "@/components/GoogleCityAutocomplete";
import { CreatorMediaGallery } from "@/components/creator/CreatorMediaGallery";

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
  const loadedFor = useRef<string | null>(null);
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
  const [upcoming, setUpcoming] = useState<{ destination: string; timing: string }[]>([]);
  const [collab, setCollab] = useState({ open: false, types: "", media_kit_url: "" });
  const [aiSummary, setAiSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  const generateSummary = async () => {
    if (!user) return;
    setSummarizing(true);
    try {
      const { data: guides } = await supabase
        .from("partner_guides")
        .select("title, tags, view_count")
        .eq("author_id", user.id)
        .eq("published", true)
        .limit(12);
      const { data, error } = await supabase.functions.invoke("ai-content-tools", {
        body: {
          tool: "creator_summary",
          name: form.display_name.trim() || "This creator",
          bio: form.bio.trim(),
          travelStyle: form.travel_style.trim(),
          niches: form.primary_niches.split(",").map((x) => x.trim()).filter(Boolean),
          regions: form.primary_regions.split(",").map((x) => x.trim()).filter(Boolean),
          countries: visited.length,
          guides: (guides ?? []).map((g: any) => ({ title: g.title, tags: g.tags, views: g.view_count })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.summary) throw new Error("No summary returned — try again");
      setAiSummary(data.summary);
      toast.success("Summary generated — review, tweak, then save");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally { setSummarizing(false); }
  };

  const updateUpcoming = (i: number, k: "destination" | "timing", v: string) =>
    setUpcoming((u) => u.map((t, j) => (j === i ? { ...t, [k]: v } : t)));
  const [countryQuery, setCountryQuery] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const regionList = form.primary_regions.split(",").map((x) => x.trim()).filter(Boolean);
  const addRegion = () => {
    const r = regionQuery.trim();
    if (!r) return;
    if (!regionList.includes(r)) {
      setForm((f) => ({ ...f, primary_regions: [...regionList, r].join(", ") }));
    }
    setRegionQuery("");
  };
  const removeRegion = (r: string) =>
    setForm((f) => ({ ...f, primary_regions: regionList.filter((x) => x !== r).join(", ") }));
  const toggleCountry = (name: string) =>
    setVisited((v) => (v.includes(name) ? v.filter((x) => x !== name) : [...v, name].sort()));
  const countryMatches = countryQuery.trim()
    ? WORLD_COUNTRIES.filter((c) => c.name.toLowerCase().includes(countryQuery.trim().toLowerCase())).slice(0, 8)
    : [];
  const toArray = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  useEffect(() => {
    // Load ONCE per signed-in user. Tab focus refreshes the auth session
    // and re-emits `user` — without this guard, the reload overwrites
    // whatever the person is typing with the last-saved values.
    if (!user || loadedFor.current === user.id) return;
    loadedFor.current = user.id;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("display_name, full_name, location, avatar_url, instagram_handle").eq("id", user.id).maybeSingle(),
        supabase
          .from("creator_profiles")
          .select(
            "display_name, handle, avatar_url, bio, travel_style, primary_niches, primary_regions, specialties, starting_price_per_night, logo_url, instagram_handle, tiktok_handle, website, linkedin_url, facebook_url, pinterest_url, visited_countries, upcoming_trips, open_to_collabs, collab_types, media_kit_url, ai_summary"
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
      setUpcoming((((c as any)?.upcoming_trips as any[]) ?? []).map((t) => ({
        destination: t?.destination || "", timing: t?.timing || "",
      })));
      setCollab({
        open: Boolean((c as any)?.open_to_collabs),
        types: (((c as any)?.collab_types as string[]) ?? []).join(", "),
        media_kit_url: (c as any)?.media_kit_url || "",
      });
      setAiSummary((c as any)?.ai_summary || "");
      setLoading(false);
    })();
  }, [user]);

  const uploadMediaKit = async (file: File) => {
    if (!user) return;
    setUploading("logo");
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/mediakit/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setCollab((cb) => ({ ...cb, media_kit_url: data.publicUrl }));
      toast.success("Media kit uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally { setUploading(null); }
  };

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

      const cPayload = {
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
        upcoming_trips: upcoming.filter((t) => t.destination.trim()),
        open_to_collabs: collab.open,
        collab_types: toArray(collab.types),
        media_kit_url: collab.media_kit_url || null,
        ai_summary: aiSummary.trim() || null,
      };
      const { data: cRows, error: cErr } = await supabase
        .from("creator_profiles")
        .update(cPayload)
        .eq("user_id", user.id)
        .select("user_id");
      if (cErr) throw cErr;
      if (!cRows || cRows.length === 0) {
        // Legacy creator — no creator_profiles row yet. Create it (own-row
        // insert permission: SQL 178).
        const { data: ins, error: insErr } = await supabase
          .from("creator_profiles")
          .insert({ user_id: user.id, ...cPayload })
          .select("user_id");
        if (insErr)
          throw new Error(
            "Couldn't create your creator record — run the creators insert policy SQL (178) and try again. (" + insErr.message + ")"
          );
        if (!ins || ins.length === 0)
          throw new Error("Couldn't create your creator record — the database blocked it. Run SQL 178 and try again.");
      }

      toast.success("Public profile saved");
    } catch (e: any) {
      toast.error(e.message || "Save failed — nothing was changed");
    } finally {
      setSaving(false);
    }
  };

  const strengthChecks: [string, boolean][] = [
    ["Profile photo", Boolean(form.avatar_url)],
    ["Your name", Boolean(form.display_name.trim())],
    ["Handle", Boolean(form.handle.trim())],
    ["Based in", Boolean(form.location.trim())],
    ["Your story", Boolean(form.bio.trim())],
    ["Travel style", Boolean(form.travel_style.trim())],
    ["Niches or regions", Boolean(form.primary_niches.trim() || form.primary_regions.trim())],
    ["3+ countries on your map", visited.length >= 3],
    ["2+ social links", [form.tiktok_handle, form.instagram_handle, form.website, form.linkedin_url, form.facebook_url, form.pinterest_url].filter((s) => s.trim()).length >= 2],
    ["Trips starting at price", Boolean(form.starting_price_per_night.trim())],
  ];
  const strength = Math.round((strengthChecks.filter(([, ok]) => ok).length / strengthChecks.length) * 100);
  const missing = strengthChecks.filter(([, ok]) => !ok).map(([l]) => l);

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

        {/* Profile strength */}
        <section className="mt-8 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[15px] font-semibold text-[#0a2225]">Profile strength</p>
            <p className="font-secondary text-2xl text-[#0c4d47]">{strength}%</p>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#EDE5D1]">
            <div className="h-full rounded-full bg-[#C7A962] transition-all" style={{ width: `${strength}%` }} />
          </div>
          {missing.length > 0 && (
            <p className="mt-3 text-[13px] text-[#6B7280]">
              To strengthen your profile: {missing.slice(0, 3).join(" · ")}
              {missing.length > 3 ? ` · +${missing.length - 3} more` : ""}
            </p>
          )}
        </section>

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
                <div className="mt-2">
                  <GoogleCityAutocomplete
                    value={form.location}
                    onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                    placeholder="Charlotte, NC, USA"
                  />
                </div>
              </div>
              <div>
                <label className={label}>Trips starting at ($/night)</label>
                <input className={input} value={form.starting_price_per_night} onChange={set("starting_price_per_night")} placeholder="300" inputMode="numeric" />
                <p className={hint}>Leave blank to hide this line.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content — the exact sections travelers see on your profile */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-secondary text-2xl text-[#0a2225]">Content</h2>
            <button type="button" onClick={() => navigate("/profile/media")}
              className="rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] hover:bg-white">
              Manage photos & video →
            </button>
          </div>
          <p className={hint}>
            Your trip highlights, exactly as they appear in the Content section of your public profile — add or remove them right here.
          </p>
          <div className="mt-5">
            {user && (
              <CreatorMediaGallery
                creatorId={user.id}
                fallbackPhotos={null}
                instagramHandle={form.instagram_handle.replace(/^@/, "").trim() || null}
                isOwnProfile
              />
            )}
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
              <div className="mt-2 flex gap-3">
                <div className="flex-1">
                  <GoogleCityAutocomplete
                    value={regionQuery}
                    onChange={setRegionQuery}
                    types={["(regions)"]}
                    placeholder="Search a country or region — e.g. Portugal"
                  />
                </div>
                <button type="button" onClick={addRegion}
                  className="shrink-0 rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] hover:bg-white">
                  Add
                </button>
              </div>
              {regionList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {regionList.map((r) => (
                    <button key={r} type="button" onClick={() => removeRegion(r)} title="Remove"
                      className="rounded-full bg-[#C7A962]/20 px-4 py-1.5 text-[13px] text-[#0a2225] hover:bg-[#C7A962]/35">
                      {r} ×
                    </button>
                  ))}
                </div>
              )}
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

        {/* Upcoming trips */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-secondary text-2xl text-[#0a2225]">Upcoming trips</h2>
            <button type="button"
              onClick={() => setUpcoming((u) => [...u, { destination: "", timing: "" }])}
              className="rounded-full border border-[#0a2225]/25 px-4 py-2 text-[13px] text-[#0a2225] hover:bg-white">
              + Add trip
            </button>
          </div>
          <p className={hint}>Travelers can request to join — every request lands in your trip funnel.</p>
          <div className="mt-4 space-y-3">
            {upcoming.map((t, i) => (
              <div key={i} className="flex flex-col gap-3 md:flex-row">
                <input className="w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-2.5 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]"
                  value={t.destination} onChange={(e) => updateUpcoming(i, "destination", e.target.value)} placeholder="Patagonia" />
                <input className="w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-2.5 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962] md:w-44"
                  value={t.timing} onChange={(e) => updateUpcoming(i, "timing", e.target.value)} placeholder="August" />
                <button type="button" onClick={() => setUpcoming((u) => u.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-full border border-[#0a2225]/20 px-3 py-2 text-[12px] text-[#0a2225]/70 hover:bg-white">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Collaborations */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">Work with brands</h2>
          <label className="mt-5 flex items-center gap-3 text-[15px] text-[#0a2225]">
            <input type="checkbox" checked={collab.open}
              onChange={(e) => setCollab((cb) => ({ ...cb, open: e.target.checked }))}
              className="h-5 w-5 accent-[#0c4d47]" />
            Open to collaborations (shows a "Work with me" section on your profile)
          </label>
          <div className="mt-5">
            <label className={label}>Collaboration types</label>
            <input className={input} value={collab.types}
              onChange={(e) => setCollab((cb) => ({ ...cb, types: e.target.value }))}
              placeholder="Sponsored posts, Hotel reviews, Press trips, Destination campaigns" />
            <p className={hint}>Separate with commas.</p>
          </div>
          <div className="mt-5">
            <label className={label}>Media kit</label>
            <input id="mediakit-input" type="file" accept=".pdf,image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadMediaKit(e.target.files[0])} />
            <div className="mt-2 flex items-center gap-3">
              <button type="button"
                onClick={() => (document.getElementById("mediakit-input") as HTMLInputElement)?.click()}
                className="rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] hover:bg-white">
                Upload media kit (PDF)
              </button>
              {collab.media_kit_url && (
                <a href={collab.media_kit_url} target="_blank" rel="noopener noreferrer"
                  className="text-[13px] font-medium text-[#0c4d47] underline underline-offset-4">
                  View current
                </a>
              )}
            </div>
          </div>
        </section>

        {/* AI summary */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="flex items-center gap-2 font-secondary text-2xl text-[#0a2225]">
            <Sparkles className="h-5 w-5 text-[#C7A962]" /> Your AI summary
          </h2>
          <p className={hint}>
            Goldsainte AI writes a short third-person summary from your real profile, map, and guide stats — it appears as a card on your public profile. Regenerate any time your numbers grow.
          </p>
          <textarea className={`${input} min-h-[90px]`} value={aiSummary}
            onChange={(e) => setAiSummary(e.target.value)}
            placeholder="Generate below — then edit to taste and Save." />
          <button type="button" onClick={generateSummary} disabled={summarizing}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-7 py-3 text-[14px] font-medium text-[#f7f3ea] hover:bg-[#0a2225] disabled:opacity-50">
            {summarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {summarizing ? "Writing…" : aiSummary ? "Regenerate" : "Generate my AI summary"}
          </button>
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
