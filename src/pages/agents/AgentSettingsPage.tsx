import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { WORLD_COUNTRIES } from "@/lib/residency";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BackButton } from "@/components/ui/BackButton";
import { Loader2, Camera, ExternalLink, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GoogleCityAutocomplete } from "@/components/GoogleCityAutocomplete";
import { AIRewriteButton } from "@/components/AIRewriteButton";

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const loadedFor = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "logo" | "agreement" | null>(null);
  const [agreementUrl, setAgreementUrl] = useState<string | null>(null);
  const agreementInput = useRef<HTMLInputElement | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    display_name: "",
    location: "",
    avatar_url: "",
    instagram_handle: "",
    agency_name: "",
    country: "",
    accepts_tips: true,
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
    languages: "",
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
          .select("display_name, full_name, location, avatar_url, instagram_handle, bio, accepts_tips")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("travel_agents")
          .select(
            "agency_name, country, bio, travel_style, destinations, specializations, starting_price_per_night, logo_url, website, linkedin_url, facebook_url, pinterest_url, languages"
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
        country: (a as any)?.country || "",
        accepts_tips: (p as any)?.accepts_tips ?? true,
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
        languages: ((a as any)?.languages ?? []).join(", "),
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

  // ── Phase 1 agreement gate (Jul 24 2026): the agent's OWN client
  // agreement, uploaded once. Travelers must e-accept it before any deposit
  // unlocks. Goldsainte hosts the document and records acceptance — it
  // authors nothing (see counsel amendment).
  useEffect(() => {
    if (!user) return;
    supabase
      .from("travel_agents")
      .select("client_agreement_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) =>
        setAgreementUrl(
          (data as { client_agreement_url?: string | null } | null)
            ?.client_agreement_url ?? null,
        ),
      );
  }, [user]);

  const uploadAgreement = async (file: File) => {
    if (!user) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF");
      return;
    }
    setUploading("agreement");
    try {
      const path = `${user.id}/agreement/${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: uErr } = await supabase
        .from("travel_agents")
        .update({ client_agreement_url: data.publicUrl })
        .eq("user_id", user.id);
      if (uErr) throw uErr;
      setAgreementUrl(data.publicUrl);
      toast.success("Client agreement uploaded");
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
          accepts_tips: form.accepts_tips,
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
          languages: toArray(form.languages),
          country: form.country || null,
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
      // Land on the finished page: seeing the live profile IS the save
      // confirmation (founder request, Jul 25 — a toast alone left people
      // unsure their changes stuck).
      if (user) navigate(`/agents/${user.id}`);
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
        <BackButton to="/agent-dashboard" className="mb-4" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">{t("accSettings.agentTitle", "Agent Settings")}</h1>
            <p className="mt-2 text-[15px] text-[#0a2225]/70">
              Everything here appears on your public profile — exactly what travelers see.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <button type="button" onClick={() => navigate(`/agents/${user.id}`)}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#0c4d47] px-3.5 text-[13px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225]">
                <ExternalLink className="h-3.5 w-3.5" /> View public profile
              </button>
            )}
            <button type="button" onClick={() => navigate("/agent-handbook")}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#C7A962]/50 px-3.5 text-[13px] font-medium text-[#8D6B2F] transition-colors hover:bg-white">
              How it works
            </button>
            <span className="mx-1 hidden h-5 w-px bg-[#E5DFC6] sm:block" />
            <button type="button" onClick={() => navigate("/agent-guides")}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border border-transparent px-3 text-[13px] text-[#0a2225]/70 transition-colors hover:border-[#E5DFC6] hover:bg-white hover:text-[#0a2225]">
              Travel guides
            </button>
          </div>
        </div>

        {/* Identity */}
        <section className="mt-10 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">{t("accSettings.identity", "Identity")}</h2>
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
                <label className={label}>{t("accSettings.yourName", "Your name")}</label>
                <input className={input} value={form.display_name} onChange={set("display_name")} placeholder={t("accSettings.phName", "Andre Powell")} />
                <p className={hint}>{t("accSettings.shownOnCard", "Shown on your card and profile.")}</p>
              </div>
              <div>
                <label className={label}>{t("accSettings.businessName", "Business name")}</label>
                <input className={input} value={form.agency_name} onChange={set("agency_name")} placeholder={t("accSettings.phBusiness", "Goldsainte Journeys")} />
                <p className={hint}>The big title on your profile — like "Celebrate and Explore."</p>
              </div>
              <div>
                <label className={label}>{t("accSettings.basedIn", "Based in")}</label>
                <div className="mt-2">
                  <GoogleCityAutocomplete
                    value={form.location}
                    onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                    placeholder={t("accSettings.phCity", "Charlotte, NC, USA")}
                  />
                </div>
              </div>
              <div>
                <label className={label}>{t("accSettings.countryOp", "Country of operation")}</label>
                <select
                  className={input}
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                >
                  <option value="">{t("accSettings.selectCountry", "Select your country")}</option>
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <p className={hint}>{t("accSettings.authSell", "Where you're authorized to sell travel \u2014 shown on your profile and trip listings.")}</p>
              </div>
              <div>
                <label className={label}>{t("accSettings.tips", "Tips")}</label>
                <label className="mt-2 flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.accepts_tips}
                    onChange={(e) => setForm((f) => ({ ...f, accepts_tips: e.target.checked }))}
                    className="h-4 w-4 accent-[#0C4D47]"
                  />
                  <span className="text-sm text-[#0a2225]">{t("accSettings.allowTips", "Allow travelers to tip me")}</span>
                </label>
                <p className={hint}>{t("accSettings.tipsDesc", "A tip button shows on your public profile. Turn this off to hide it.")}</p>
              </div>
              <div>
                <label className={label}>Trips starting at ($/night)</label>
                <input className={input} value={form.starting_price_per_night} onChange={set("starting_price_per_night")} placeholder="400" inputMode="numeric" />
                <p className={hint}>{t("accSettings.leaveBlank", "Leave blank to hide this line.")}</p>
              </div>
              <div>
                <label className={label}>{t("accSettings.langsSpoken", "Languages spoken")}</label>
                <input className={input} value={form.languages} onChange={set("languages")} placeholder={t("accSettings.phLangs", "English, Spanish, Portuguese")} />
                <p className={hint}>{t("accSettings.commasCard", "Separate with commas \u2014 shown on your card, like Fora.")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Client agreement — the deposit gate */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">{t("accSettings.clientAgreement", "Client agreement")}</h2>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            Your own engagement agreement, shown to every traveler and e-accepted
            before they can pay a deposit. Goldsainte never provides, edits, or
            endorses this document — it is yours.
          </p>
          <p className="mt-3 text-[13px] text-[#6B7280]">
            <span className="font-medium text-[#0a2225]">{t("accSettings.noAgreementYet", "Don't have one yet?")}</span>{" "}
            Industry sources license attorney-drafted client agreements directly
            to advisors:{" "}
            <a href="https://www.asta.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">ASTA</a>{" "}
            (member template),{" "}
            <a href="https://travelindustrysolutions.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Travel Industry Solutions</a>,{" "}
            <a href="https://welcome.traveladvisorresourcecenter.com/courses/legal-templates" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Travel Advisor Resource Center</a>.
            License from them directly and have your attorney review before use.
          </p>
          {/* ALIGNMENT (Jul 26). A bare <span>, <a> and <button> in one flex
              row compute different box heights — the check glyph and the
              button's UA line-height don't match the link's — so the three
              items sat at visibly different heights. Each is now an
              inline-flex box with the same leading, so they cannot disagree. */}
          {agreementUrl ? (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-[#0c4d47]/[0.06] p-4 text-[14px] leading-none">
              <span className="inline-flex items-center gap-1.5 font-medium leading-none text-[#0c4d47]">
                <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
                Client agreement uploaded
              </span>
              <a href={agreementUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center whitespace-nowrap leading-none underline underline-offset-2 text-[#0c4d47]">
                View
              </a>
              <button type="button" onClick={() => agreementInput.current?.click()} disabled={uploading === "agreement"}
                className="inline-flex items-center whitespace-nowrap leading-none underline underline-offset-2 text-[#0a2225]/70 disabled:opacity-60">
                {uploading === "agreement" ? "Uploading…" : "Replace"}
              </button>
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-[14px] text-amber-900">
              <p className="font-medium">{t("accSettings.requiredDeposits", "Required to receive deposits")}</p>
              <p className="mt-1">{t("accSettings.agreementOnFile", "Travelers can't pay you until your agreement is on file.")}</p>
              <button type="button" onClick={() => agreementInput.current?.click()} disabled={uploading === "agreement"}
                className="mt-3 rounded-full bg-[#0c4d47] px-5 py-2 text-[13.5px] text-white disabled:opacity-60">
                {uploading === "agreement" ? "Uploading…" : "Upload PDF"}
              </button>
            </div>
          )}
          <input ref={agreementInput} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAgreement(f); e.currentTarget.value = ""; }} />
        </section>

        {/* Story */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">{t("accSettings.yourStory", "Your story")}</h2>
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className={label}>{t("accSettings.ourStory", "Our story")}</label>
                <AIRewriteButton
                  value={form.story}
                  onRewrite={(text) => setForm((f) => ({ ...f, story: text }))}
                  fieldLabel="Our story"
                  persona="travel agent"
                />
              </div>
              <textarea className={`${input} min-h-[120px]`} value={form.story} onChange={set("story")} placeholder={t("accSettings.phStoryA", "Why you do this, in your voice\u2026")} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className={label}>{t("accSettings.travelStyle", "Travel style")}</label>
                <AIRewriteButton
                  value={form.travel_style}
                  onRewrite={(text) => setForm((f) => ({ ...f, travel_style: text }))}
                  fieldLabel="Travel style"
                  persona="travel agent"
                />
              </div>
              <textarea className={`${input} min-h-[120px]`} value={form.travel_style} onChange={set("travel_style")} placeholder={t("accSettings.phStyleA", "How you like to travel and design trips\u2026")} />
            </div>
          </div>
        </section>

        {/* Expertise */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">{t("accSettings.askUsAbout", "Ask us about")}</h2>
          <div className="mt-6 space-y-6">
            <div>
              <label className={label}>{t("accSettings.destinations", "Destinations")}</label>
              <input className={input} value={form.destinations} onChange={set("destinations")} placeholder={t("accSettings.phDest", "Japan, Morocco, Portugal")} />
              <p className={hint}>{t("accSettings.commasTags", "Separate with commas \u2014 these become the tags on your profile.")}</p>
            </div>
            <div>
              <label className={label}>{t("accSettings.specialties", "Specialties")}</label>
              <input className={input} value={form.specializations} onChange={set("specializations")} placeholder={t("accSettings.phSpecA", "Milestone celebrations, Group travel")} />
              <p className={hint}>{t("accSettings.commas", "Separate with commas.")}</p>
            </div>
          </div>
        </section>

        {/* Stay connected */}
        <section className="mt-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
          <h2 className="font-secondary text-2xl text-[#0a2225]">{t("accSettings.stayConnected", "Stay connected")}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className={label}>Instagram</label>
              <input className={input} value={form.instagram_handle} onChange={set("instagram_handle")} placeholder="@yourhandle" />
            </div>
            <div>
              <label className={label}>{t("accSettings.website", "Website")}</label>
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
