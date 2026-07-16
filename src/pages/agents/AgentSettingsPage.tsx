import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, Camera, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GoogleCityAutocomplete } from "@/components/GoogleCityAutocomplete";

// ============================================================================
// AgentSettingsPage (Jul 15, 11 PM build) — "Edit public profile" for agents.
// One form, every field the Fora-style public page renders:
//   profiles:      display_name, full_name, location, bio fallback, avatar,
//                  instagram_handle
//   travel_agents: agency_name, bio (Our Story), travel_style, destinations,
//                  specializations, starting_price_per_night, logo_url,
//                  website, linkedin_url, facebook_url, pinterest_url
// Photo + logo upload reuse the existing 'avatars' storage bucket pattern.
// Agents reach this from Account Settings (Header routes them here) —
// creators keep /travel-settings.
// ============================================================================

const label = "block text-[15px] font-semibold text-[#0a2225]";
const hint = "mt-1 text-[13px] text-[#6B7280]";
const input =
  "mt-2 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]";

export default function AgentSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const loadedFor = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "logo" | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    display_name: "",
    location: "",
    avatar_url: "",
    instagram_handle: "",
    agency_name: "",
    story: "",
    travel_style: "",
    destinations: "",
    specializations: "",
    starting_price_per_night: "",
    logo_url: "",
    website: "",
    linkedin_url: "",
    facebook_url: "",
    pinterest_url: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    // Load ONCE per signed-in user. Tab focus refreshes the auth session
    // and re-emits `user` — without this guard, the reload overwrites
    // whatever the person is typing with the last-saved values.
    if (!user || loadedFor.current === user.id) return;
    loadedFor.current = user.id;
    (async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, full_name, location, avatar_url, instagram_handle, bio")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("travel_agents")
          .select(
            "agency_name, bio, travel_style, destinations, specializations, starting_price_per_night, logo_url, website, linkedin_url, facebook_url, pinterest_url"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setForm({
        display_name: p?.display_name || p?.full_name || "",
        location: p?.location || "",
        avatar_url: p?.avatar_url || "",
        instagram_handle: p?.instagram_handle || "",
        agency_name: a?.agency_name || "",
        story: a?.bio || p?.bio || "",
        travel_style: a?.travel_style || "",
        destinations: (a?.destinations || []).join(", "),
        specializations: (a?.specializations || []).join(", "),
        starting_price_per_night: a?.starting_price_per_night ? String(a.starting_price_per_night) : "",
        logo_url: a?.logo_url || "",
        website: a?.website || "",
        linkedin_url: a?.linkedin_url || "",
        facebook_url: a?.facebook_url || "",
        pinterest_url: a?.pinterest_url || "",
      });
      setLoading(false);
    })();
  }, [user]);

  const uploadImage = async (file: File, kind: "avatar" | "logo") => {
    if (!user) return;
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${kind}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: false });
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

  const toArray = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const price = form.starting_price_per_night.trim()
        ? Number(form.starting_price_per_night)
        : null;
      if (form.starting_price_per_night.trim() && Number.isNaN(price)) {
        throw new Error("Starting price must be a number");
      }
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
      if (!pRows || pRows.length === 0) {
        throw new Error("Your profile row couldn't be updated — nothing was saved.");
      }
      const { data: aRows, error: aErr } = await supabase
        .from("travel_agents")
        .update({
          agency_name: form.agency_name.trim() || null,
          bio: form.story.trim() || null,
          travel_style: form.travel_style.trim() || null,
          destinations: toArray(form.destinations),
          specializations: toArray(form.specializations),
          starting_price_per_night: price,
          logo_url: form.logo_url || null,
          website: form.website.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          facebook_url: form.facebook_url.trim() || null,
          pinterest_url: form.pinterest_url.trim() || null,
        })
        .eq("user_id", user.id)
        .select("user_id");
      if (aErr) throw aErr;
      if (!aRows || aRows.length === 0) {
        throw new Error(
          "Your specialist details couldn't be saved — the database blocked the update (permissions). Run the travel_agents policy SQL and try again."
        );
      }
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
      <Helmet>
        <title>Agent Settings · Goldsainte</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-secondary text-4xl text-[#0a2225]">Agent Settings</h1>
            <p className="mt-2 text-[15px] text-[#0a2225]/70">
              Everything here appears on your public profile — exactly what travelers see.
            </p>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => navigate(`/agents/${user.id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white"
            >
              <ExternalLink className="h-4 w-4" /> View public profile
            </button>
          )}
          {user && (
            <button
              type="button"
              onClick={() => navigate("/agent-guides")}
              className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/25 px-5 py-2.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white"
            >
              Travel guides
            </button>
          )}
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
                  {(form.display_name || "G").slice(0, 2).toUpperCase()}
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
                  Business logo
                </div>
              )}
              <button type="button" onClick={() => logoInput.current?.click()} disabled={uploading === "logo"}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0c4d47] underline underline-offset-4">
                {uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                Business logo
              </button>
            </div>
            <div className="min-w-[260px] flex-1 space-y-5">
              <div>
                <label className={label}>Your name</label>
                <input className={input} value={form.display_name} onChange={set("display_name")} placeholder="Andre Powell" />
                <p className={hint}>Shown on your card and profile.</p>
              </div>
              <div>
                <label className={label}>Business name</label>
                <input className={input} value={form.agency_name} onChange={set("agency_name")} placeholder="Goldsainte Journeys" />
                <p className={hint}>The big title on your profile — like "Celebrate and Explore."</p>
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
                <input className={input} value={form.starting_price_per_night} onChange={set("starting_price_per_night")} placeholder="400" inputMode="numeric" />
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
              <textarea className={`${input} min-h-[120px]`} value={form.story} onChange={set("story")} placeholder="Why you do this, in your voice…" />
            </div>
            <div>
              <label className={label}>Travel style</label>
              <textarea className={`${input} min-h-[120px]`} value={form.travel_style} onChange={set("travel_style")} placeholder="How you like to travel and design trips…" />
            </div>
          </div>
        </section>

        {/* Expertise */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">Ask us about</h2>
          <div className="mt-6 space-y-6">
            <div>
              <label className={label}>Destinations</label>
              <input className={input} value={form.destinations} onChange={set("destinations")} placeholder="Japan, Morocco, Portugal" />
              <p className={hint}>Separate with commas — these become the tags on your profile.</p>
            </div>
            <div>
              <label className={label}>Specialties</label>
              <input className={input} value={form.specializations} onChange={set("specializations")} placeholder="Milestone celebrations, Group travel" />
              <p className={hint}>Separate with commas.</p>
            </div>
          </div>
        </section>

        {/* Stay connected */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">Stay connected</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
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
          <button
            type="button"
            onClick={save}
            disabled={saving || uploading !== null}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-10 py-4 text-[15px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save public profile
          </button>
        </div>
      </div>
    </div>
  );
}
