import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

type WaitlistRow = {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
};

export default function AdminWaitlistPage() {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("waitlist")
        .select("id, email, source, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load waitlist");
      } else {
        setRows((data ?? []) as WaitlistRow[]);
      }
      setLoading(false);
    })();
  }, []);

  const exportCsv = () => {
    const header = "email,source,signup_date\n";
    const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const body = rows
      .map((r) =>
        [escape(r.email), escape(r.source ?? ""), escape(new Date(r.created_at).toISOString())].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-secondary text-3xl text-[#0a2225]">Waitlist</h1>
          <p className="mt-2 text-sm text-[#0a2225]/70">
            Total signups: <span className="font-semibold">{rows.length}</span>
          </p>
        </div>
        <Button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331]"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-lg border border-[#E5DFC6] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f7f3ea] text-[#0a2225]/70 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Signup Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-[#0a2225]/60">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-[#0a2225]/60">No signups yet.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-[#E5DFC6]">
                  <td className="px-4 py-3 text-[#0a2225]">{r.email}</td>
                  <td className="px-4 py-3 text-[#0a2225]/70">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}