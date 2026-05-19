import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

const empty = {
  slug: "",
  type: "press_release",
  title: "",
  subtitle: "",
  excerpt: "",
  body: "",
  hero_image_url: "",
  hero_image_alt: "",
  hero_image_credit: "",
  author_id: "",
  status: "draft",
  published_at: "",
  meta_title: "",
  meta_description: "",
  og_image_url: "",
  canonical_url: "",
  category: "",
  tags: "",
  dateline_location: "",
  press_contact_name: "",
  press_contact_email: "info@goldsainte.com",
};

export default function AdminArticleEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState<any>(empty);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    (supabase as any).from("newsroom_authors").select("id,full_name").then((r: any) => setAuthors(r.data || []));
  }, []);

  useEffect(() => {
    if (!id) return;
    (supabase as any).from("newsroom_articles").select("*").eq("id", id).maybeSingle().then((r: any) => {
      if (r.data) {
        setForm({
          ...empty,
          ...r.data,
          tags: (r.data.tags || []).join(", "),
          author_id: r.data.author_id || "",
          published_at: r.data.published_at ? r.data.published_at.slice(0, 16) : "",
        });
      }
      setLoading(false);
    });
  }, [id]);

  function set<K extends string>(k: K, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function uploadHero(file: File) {
    const path = `articles/${crypto.randomUUID()}-${file.name}`;
    const { error } = await (supabase as any).storage.from("newsroom-media").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = (supabase as any).storage.from("newsroom-media").getPublicUrl(path);
    set("hero_image_url", data.publicUrl);
    toast.success("Hero uploaded");
  }

  async function save(publish?: boolean) {
    if (!form.title || !form.excerpt || !form.body) {
      toast.error("Title, excerpt, and body are required.");
      return;
    }
    const payload: any = {
      slug: form.slug || slugify(form.title),
      type: form.type,
      title: form.title,
      subtitle: form.subtitle || null,
      excerpt: form.excerpt,
      body: form.body,
      hero_image_url: form.hero_image_url || null,
      hero_image_alt: form.hero_image_alt || null,
      hero_image_credit: form.hero_image_credit || null,
      author_id: form.author_id || null,
      status: publish ? "published" : form.status,
      published_at:
        publish && !form.published_at ? new Date().toISOString() :
        form.published_at ? new Date(form.published_at).toISOString() : null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      og_image_url: form.og_image_url || null,
      canonical_url: form.canonical_url || null,
      category: form.category || null,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      dateline_location: form.dateline_location || null,
      press_contact_name: form.press_contact_name || null,
      press_contact_email: form.press_contact_email || null,
    };
    const res = id
      ? await (supabase as any).from("newsroom_articles").update(payload).eq("id", id)
      : await (supabase as any).from("newsroom_articles").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(publish ? "Published" : "Saved");
    nav("/admin/newsroom");
  }

  if (loading) return <div className="p-10">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-serif">{id ? "Edit Article" : "New Article"}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Title *" value={form.title} onChange={(v) => { set("title", v); if (!id && !form.slug) set("slug", slugify(v)); }} />
        <Input label="Slug" value={form.slug} onChange={(v) => set("slug", v)} />
        <Select label="Type *" value={form.type} onChange={(v) => set("type", v)}
          options={[["press_release","Press Release"],["news","News"],["announcement","Announcement"]]} />
        <Select label="Status" value={form.status} onChange={(v) => set("status", v)}
          options={[["draft","Draft"],["published","Published"],["archived","Archived"]]} />
        <Input label="Subtitle" value={form.subtitle} onChange={(v) => set("subtitle", v)} />
        <Input label="Category" value={form.category} onChange={(v) => set("category", v)} />
        <Input label="Dateline (e.g. CHARLOTTE, NC)" value={form.dateline_location} onChange={(v) => set("dateline_location", v)} />
        <Input label="Publish at" type="datetime-local" value={form.published_at} onChange={(v) => set("published_at", v)} />
        <Select label="Author" value={form.author_id} onChange={(v) => set("author_id", v)}
          options={[["",""],...authors.map((a) => [a.id, a.full_name] as [string,string])]} />
        <Input label="Tags (comma separated)" value={form.tags} onChange={(v) => set("tags", v)} />
      </div>
      <Textarea label="Excerpt *" value={form.excerpt} onChange={(v) => set("excerpt", v)} rows={2} />
      <div>
        <label className="text-xs uppercase">Hero image</label>
        <input type="file" accept="image/*" onChange={(e) => e.target.files && uploadHero(e.target.files[0])} className="block mt-1 text-sm" />
        {form.hero_image_url && <img src={form.hero_image_url} alt="" className="mt-2 max-h-48" />}
        <div className="grid md:grid-cols-3 gap-3 mt-2">
          <Input label="Hero URL" value={form.hero_image_url} onChange={(v) => set("hero_image_url", v)} />
          <Input label="Hero alt" value={form.hero_image_alt} onChange={(v) => set("hero_image_alt", v)} />
          <Input label="Hero credit" value={form.hero_image_credit} onChange={(v) => set("hero_image_credit", v)} />
        </div>
      </div>
      <div data-color-mode="light">
        <label className="text-xs uppercase">Body (Markdown) *</label>
        <Suspense fallback={<div>Loading editor…</div>}>
          <MDEditor value={form.body} onChange={(v) => set("body", v || "")} height={500} />
        </Suspense>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Meta title" value={form.meta_title} onChange={(v) => set("meta_title", v)} />
        <Input label="Canonical URL" value={form.canonical_url} onChange={(v) => set("canonical_url", v)} />
        <Input label="OG image URL" value={form.og_image_url} onChange={(v) => set("og_image_url", v)} />
        <Input label="Press contact name" value={form.press_contact_name} onChange={(v) => set("press_contact_name", v)} />
        <Input label="Press contact email" value={form.press_contact_email} onChange={(v) => set("press_contact_email", v)} />
      </div>
      <Textarea label="Meta description" value={form.meta_description} onChange={(v) => set("meta_description", v)} rows={2} />
      <div className="flex gap-3 pt-4 border-t">
        <button onClick={() => save(false)} className="px-5 py-2 border">Save</button>
        <button onClick={() => save(true)} className="px-5 py-2 bg-[#0c4d47] text-white">Save & Publish</button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-xs uppercase block mb-1">{label}</label>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full border px-3 py-2 text-sm" />
    </div>
  );
}
function Textarea({ label, value, onChange, rows = 3 }: any) {
  return (
    <div>
      <label className="text-xs uppercase block mb-1">{label}</label>
      <textarea value={value || ""} rows={rows} onChange={(e) => onChange(e.target.value)} className="w-full border px-3 py-2 text-sm" />
    </div>
  );
}
function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-xs uppercase block mb-1">{label}</label>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full border px-3 py-2 text-sm bg-white">
        {options.map(([v, l]: [string,string]) => <option key={v} value={v}>{l || "—"}</option>)}
      </select>
    </div>
  );
}