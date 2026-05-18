import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminNewsroomList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: articles = [], refetch } = useQuery({
    queryKey: ["admin", "newsroom", statusFilter, typeFilter],
    queryFn: async () => {
      let q = (supabase as any).from("newsroom_articles").select("*").order("updated_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  async function del(id: string) {
    if (!confirm("Delete this article?")) return;
    await (supabase as any).from("newsroom_articles").delete().eq("id", id);
    refetch();
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif">Newsroom — Articles</h1>
        <div className="flex gap-2">
          <Link to="/admin/newsroom/authors" className="px-4 py-2 border text-sm">Authors</Link>
          <Link to="/admin/newsroom/new" className="px-4 py-2 bg-[#0c4d47] text-white text-sm">New Article</Link>
        </div>
      </div>
      <div className="flex gap-3 mb-4 text-sm">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-3 py-2">
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border px-3 py-2">
          <option value="all">All types</option>
          <option value="press_release">Press Release</option>
          <option value="news">News</option>
          <option value="announcement">Announcement</option>
        </select>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-[#0a2225]/60 border-b">
          <tr><th className="py-2">Title</th><th>Type</th><th>Status</th><th>Published</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {articles.map((a: any) => (
            <tr key={a.id}>
              <td className="py-3"><Link to={`/admin/newsroom/${a.id}/edit`} className="hover:underline">{a.title}</Link></td>
              <td>{a.type}</td>
              <td>{a.status}</td>
              <td>{a.published_at ? new Date(a.published_at).toLocaleDateString() : "—"}</td>
              <td><button onClick={() => del(a.id)} className="text-red-600 text-xs">Delete</button></td>
            </tr>
          ))}
          {articles.length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-[#0a2225]/50">No articles.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}