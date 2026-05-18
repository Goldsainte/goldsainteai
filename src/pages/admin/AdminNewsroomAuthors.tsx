import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminNewsroomAuthors() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    const { data } = await (supabase as any).from("newsroom_authors").select("*").order("full_name");
    setAuthors(data || []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    const payload = {
      ...editing,
      slug: editing.slug || slugify(editing.full_name),
      expertise: typeof editing.expertise === "string"
        ? editing.expertise.split(",").map((s: string) => s.trim()).filter(Boolean)
        : editing.expertise || [],
    };
    const res = editing.id
      ? await (supabase as any).from("newsroom_authors").update(payload).eq("id", editing.id)
      : await (supabase as any).from("newsroom_authors").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    setEditing(null); load();
  }

  async function del(id: string) {
    if (!confirm("Delete?")) return;
    await (supabase as any).from("newsroom_authors").delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif">Newsroom Authors</h1>
        <button onClick={() => setEditing({ full_name: "", title: "", bio: "", slug: "", expertise: "" })}
          className="px-4 py-2 bg-[#0c4d47] text-white text-sm">New Author</button>
      </div>
      <ul className="divide-y border-y">
        {authors.map((a) => (
          <li key={a.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{a.full_name}</p>
              <p className="text-xs text-[#0a2225]/60">{a.title}</p>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => setEditing({ ...a, expertise: (a.expertise || []).join(", ") })}>Edit</button>
              <button onClick={() => del(a.id)} className="text-red-600">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-lg w-full p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-serif mb-2">{editing.id ? "Edit" : "New"} Author</h2>
            {[
              ["full_name","Full name"],["slug","Slug"],["title","Title"],["email","Email"],
              ["avatar_url","Avatar URL"],["linkedin_url","LinkedIn URL"],["twitter_url","Twitter URL"],
              ["quote","Quote"],["expertise","Expertise (comma)"],
            ].map(([k,l]) => (
              <input key={k} placeholder={l} value={editing[k] || ""}
                onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                className="w-full border px-3 py-2 text-sm" />
            ))}
            <textarea placeholder="Bio" value={editing.bio || ""} rows={6}
              onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
              className="w-full border px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-[#0c4d47] text-white text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}