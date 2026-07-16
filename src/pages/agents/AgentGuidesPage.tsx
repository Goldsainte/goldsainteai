import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, Camera, Plus, ExternalLink, PenLine, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ============================================================================
// AgentGuidesPage — where agents WRITE the "Travel ideas" guides.
// List of your guides + a single editor form: title, hero image (avatars
// bucket upload), tags, curator's statement, body in a documented
// markdown-lite (## headings, - bullets, bare image URLs), publish toggle.
// Route: /agent-guides (linked from Agent Settings).
// ============================================================================

interface HotelDraft { name: string; description: string; perksText: string }

interface GuideRow {
  id: string; title: string; slug: string; hero_image_url: string | null;
  tags: string[]; statement: string | null; body: string | null; published: boolean;
  view_count: number;
  hotels: { name: string; description: string; perks: string[] }[];
}

const label = "block text-[15px] font-semibold text-[#0a2225]";
const input =
  "mt-2 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]";

// Fora rhythm: a full-width location photo directly under each section
// heading. Bare URLs on their own line are what GuidePage renders as photos.
const weavePhotos = (body: string, photos: string[]) => {
  if (!photos.length || !body) return body;
  const blocks = body.split(/\n{2,}/);
  const out: string[] = [];
  let i = 0;
  for (const b of blocks) {
    out.push(b);
    if (b.startsWith("## ") && i < photos.length) out.push(photos[i++]);
  }
  return out.join("\n\n");
};

const slugify = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) +
  "-" + Math.random().toString(36).slice(2, 6);

export default function AgentGuidesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroInput = useRef<HTMLInputElement>(null);
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [editing, setEditing] = useState<GuideRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", hero_image_url: "", tags: "", statement: "", body: "", published: true });
  const [hotels, setHotels] = useState<HotelDraft[]>([]);
  const updateHotel = (i: number, k: keyof HotelDraft, v: string) =>
    setHotels((hs) => hs.map((h, j) => (j === i ? { ...h, [k]: v } : h)));
  const [ai, setAi] = useState({ destination: "", days: "", notes: "" });
  const [generating, setGenerating] = useState(false);
  const setAiField = (k: keyof typeof ai) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setAi((f) => ({ ...f, [k]: e.target.value }));

  const generate = async () => {
    if (!ai.destination.trim()) { toast.error("Tell the AI a destination or topic"); return; }
    setGenerating(true);
    try {
      // Voice: the author's own travel style — agents from travel_agents,
      // creators from creator_profiles (whichever row exists).
      let voiceStyle = "";
      if (user) {
        const { data: agentRow } = await supabase.from("travel_agents").select("travel_style").eq("user_id", user.id).maybeSingle();
        if (agentRow?.travel_style) voiceStyle = agentRow.travel_style;
        else {
          const { data: creatorRow } = await supabase.from("creator_profiles").select("travel_style").eq("user_id", user.id).maybeSingle();
          voiceStyle = creatorRow?.travel_style || "";
        }
      }
      const { data, error } = await supabase.functions.invoke("ai-content-tools", {
        body: {
          tool: "guide",
          destination: ai.destination.trim(),
          days: ai.days.trim(),
          notes: ai.notes.trim(),
          voice: voiceStyle,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Real photography, AI-matched to the destination, via the already
      // deployed unsplash-search function (same source as storyboards).
      let photos: string[] = [];
      try {
        const { data: ph } = await supabase.functions.invoke("unsplash-search", {
          body: { q: ai.destination.trim() },
        });
        photos = ((ph?.results as any[]) ?? [])
          .map((r) => r?.urls?.regular)
          .filter(Boolean)
          .slice(0, 5);
      } catch (e) {
        console.error("photo search failed — guide continues without photos", e);
      }

      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        statement: data.statement || f.statement,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : f.tags,
        body: weavePhotos(data.body || f.body, photos.slice(1)),
        hero_image_url: f.hero_image_url || photos[0] || f.hero_image_url,
      }));
      if (Array.isArray(data.hotels) && data.hotels.length > 0) {
        setHotels(
          data.hotels.map((h: any) => ({
            name: h.name || "", description: h.description || "",
            perksText: Array.isArray(h.perks) ? h.perks.join("\n") : "",
          }))
        );
      }
      toast.success("Draft generated with location photos — review, edit, then save");
    } catch (e: any) {
      toast.error(e.message || "Generation failed — try again");
    } finally { setGenerating(false); }
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("partner_guides")
      .select("id, title, slug, hero_image_url, tags, statement, body, published, hotels, view_count")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    setGuides((data as GuideRow[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const openNew = () => {
    setEditing(null); setCreating(true);
    setForm({ title: "", hero_image_url: "", tags: "", statement: "", body: "", published: true });
    setHotels([]);
  };
  const openEdit = (g: GuideRow) => {
    setCreating(true); setEditing(g);
    setForm({
      title: g.title, hero_image_url: g.hero_image_url || "", tags: (g.tags || []).join(", "),
      statement: g.statement || "", body: g.body || "", published: g.published,
    });
    setHotels(
      (g.hotels ?? []).map((h) => ({
        name: h.name || "", description: h.description || "", perksText: (h.perks ?? []).join("\n"),
      }))
    );
  };

  const uploadHero = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/guides/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm((f) => ({ ...f, hero_image_url: data.publicUrl }));
      toast.success("Hero image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim()) { toast.error("Give the guide a title"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        hero_image_url: form.hero_image_url || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        statement: form.statement.trim() || null,
        body: form.body.trim() || null,
        published: form.published,
        hotels: hotels
          .filter((h) => h.name.trim())
          .map((h) => ({
            name: h.name.trim(),
            description: h.description.trim(),
            perks: h.perksText.split("\n").map((x) => x.trim()).filter(Boolean),
          })),
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from("partner_guides").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partner_guides").insert({
          ...payload,
          author_id: user.id,
          author_kind: (await supabase.from("travel_agents").select("user_id").eq("user_id", user.id).maybeSingle()).data
            ? "agent"
            : "creator",
          slug: slugify(form.title),
        });
        if (error) throw error;
      }
      toast.success("Guide saved");
      setCreating(false); setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet><title>Travel Guides · Goldsainte</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-secondary text-4xl text-[#0a2225]">Travel guides</h1>
            <p className="mt-2 text-[15px] text-[#0a2225]/70">
              Your stories — they appear as Travel ideas on your public profile.
            </p>
          </div>
          <button type="button" onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-6 py-3 text-[14px] font-medium text-[#f7f3ea] hover:bg-[#0a2225]">
            <Plus className="h-4 w-4" /> New guide
          </button>
        </div>

        {!creating && (
          <div className="mt-8 space-y-4">
            {guides.length === 0 && (
              <div className="rounded-3xl border border-[#E5DFC6] bg-white/60 p-10 text-center">
                <p className="font-secondary text-xl text-[#0a2225]">No guides yet</p>
                <p className="mt-2 text-sm text-[#6B7280]">Write your first story — a destination you know cold.</p>
              </div>
            )}
            {guides.map((g) => (
              <div key={g.id} className="flex items-center gap-4 rounded-2xl border border-[#E5DFC6] bg-white/70 p-4">
                {g.hero_image_url && <img src={g.hero_image_url} alt="" className="h-16 w-24 rounded-xl object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-secondary text-xl text-[#0a2225]">{g.title}</p>
                  <p className="text-[13px] text-[#6B7280]">
                    {g.published ? "Published" : "Draft"}
                    {g.published ? ` · ${(g.view_count ?? 0).toLocaleString()} view${(g.view_count ?? 0) === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                <button type="button" onClick={() => navigate(`/guides/${g.slug}`)} title="View"
                  className="rounded-full border border-[#0a2225]/25 p-2.5 text-[#0a2225] hover:bg-white"><ExternalLink className="h-4 w-4" /></button>
                <button type="button" onClick={() => openEdit(g)} title="Edit"
                  className="rounded-full border border-[#0a2225]/25 p-2.5 text-[#0a2225] hover:bg-white"><PenLine className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}

        {creating && (
          <div className="mt-8 space-y-6 rounded-3xl border border-[#E5DFC6] bg-white/60 p-6 md:p-8">
            {/* Write with AI */}
            <div className="rounded-2xl bg-[#0c4d47]/[0.06] p-5">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-[#0a2225]">
                <Sparkles className="h-4 w-4 text-[#C7A962]" /> Write it with AI
              </p>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                Name the destination, add anything it must include, and get a full draft in your voice — then edit before publishing.
              </p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input className="w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]"
                  value={ai.destination} onChange={setAiField("destination")} placeholder="Destination or topic — e.g. Portofino & the Italian Riviera" />
                <input className="w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962] md:w-32"
                  value={ai.days} onChange={setAiField("days")} placeholder="Days" inputMode="numeric" />
              </div>
              <textarea className="mt-3 min-h-[64px] w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]"
                value={ai.notes} onChange={setAiField("notes")} placeholder="Optional: must-include hotels, restaurants, experiences, or angle" />
              <button type="button" onClick={generate} disabled={generating}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-7 py-3 text-[14px] font-medium text-[#f7f3ea] hover:bg-[#0a2225] disabled:opacity-50">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Writing your guide…" : "Generate draft"}
              </button>
            </div>

            <div>
              <label className={label}>Title</label>
              <input className={input} value={form.title} onChange={set("title")} placeholder="A 10-Day Itinerary Through Portugal" />
            </div>
            <div>
              <label className={label}>Hero image</label>
              <input ref={heroInput} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadHero(e.target.files[0])} />
              {form.hero_image_url && <img src={form.hero_image_url} alt="" className="mt-3 h-44 w-full rounded-2xl object-cover" />}
              <button type="button" onClick={() => heroInput.current?.click()} disabled={uploading}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0c4d47] underline underline-offset-4">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />} Upload hero image
              </button>
            </div>
            <div>
              <label className={label}>Tags</label>
              <input className={input} value={form.tags} onChange={set("tags")} placeholder="Portugal, Porto, Beaches, Active Travel" />
            </div>
            <div>
              <label className={label}>Curator's statement</label>
              <textarea className={`${input} min-h-[100px]`} value={form.statement} onChange={set("statement")}
                placeholder="The short, evocative intro at the top of the guide…" />
            </div>
            <div>
              <label className={label}>The guide</label>
              <textarea className={`${input} min-h-[320px] font-mono text-[14px]`} value={form.body} onChange={set("body")}
                placeholder={"## Where to stay\n\nA paragraph about the area.\n\n- Splendido, Portofino: why it's special\n- Grand Hotel Miramare: why it's special\n\nhttps://…/photo.jpg\n\n## Things to do\n\n- Wander the Piazzetta: the heart of town\n- Lunch at DaV Mare: order the Pasta DaV"} />
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                Formatting: start a line with <span className="font-mono">##</span> for a section heading, <span className="font-mono">-</span> for an arrow bullet, paste a bare image URL on its own line for a full-width photo, and leave a blank line between blocks.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className={label}>Where to stay</label>
                <button type="button"
                  onClick={() => setHotels((hs) => [...hs, { name: "", description: "", perksText: "" }])}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2225]/25 px-4 py-2 text-[13px] text-[#0a2225] hover:bg-white">
                  <Plus className="h-3.5 w-3.5" /> Add hotel
                </button>
              </div>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                Renders as the hotel carousel with per-property bullets. Only list perks you can actually deliver.
              </p>
              <div className="mt-4 space-y-5">
                {hotels.map((h, i) => (
                  <div key={i} className="rounded-2xl border border-[#E5DFC6] bg-white/70 p-4">
                    <div className="flex items-center gap-3">
                      <input className="w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-2.5 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]"
                        value={h.name} onChange={(e) => updateHotel(i, "name", e.target.value)}
                        placeholder="Splendido, A Belmond Hotel, Portofino" />
                      <button type="button" onClick={() => setHotels((hs) => hs.filter((_, j) => j !== i))}
                        className="shrink-0 rounded-full border border-[#0a2225]/20 px-3 py-2 text-[12px] text-[#0a2225]/70 hover:bg-white">
                        Remove
                      </button>
                    </div>
                    <textarea className="mt-3 min-h-[64px] w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-2.5 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]"
                      value={h.description} onChange={(e) => updateHotel(i, "description", e.target.value)}
                      placeholder="Two or three sentences on why this property." />
                    <textarea className="mt-3 min-h-[64px] w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-2.5 text-[15px] text-[#0a2225] outline-none focus:border-[#C7A962]"
                      value={h.perksText} onChange={(e) => updateHotel(i, "perksText", e.target.value)}
                      placeholder={"One perk or highlight per line\nBreakfast daily.\nUpgrade & extended check-in/out whenever possible."} />
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 text-[15px] text-[#0a2225]">
              <input type="checkbox" checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="h-5 w-5 accent-[#0c4d47]" />
              Published (visible on your public profile)
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }}
                className="rounded-full border border-[#0a2225]/25 px-7 py-3.5 text-[15px] text-[#0a2225] hover:bg-white">Cancel</button>
              <button type="button" onClick={save} disabled={saving || uploading}
                className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-8 py-3.5 text-[15px] font-medium text-[#f7f3ea] hover:bg-[#0a2225] disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save guide
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
