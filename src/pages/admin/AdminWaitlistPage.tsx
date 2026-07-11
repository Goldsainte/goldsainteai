import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
        toast.error(`Failed to load waitlist: ${error.message}`);
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
    <div className="min-h-screen bg-[#f7f3ea]">
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">People</p>
          <h1 className="mt-2 font-secondary text-[28px] leading-tight text-[#0a2225] md:text-[30px]">Waitlist</h1>
          <p className="mt-2 text-sm text-[#0a2225]/55">
            Total signups: <span className="font-semibold text-[#0a2225]">{rows.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
        <table className="w-full text-sm">
          <thead className="bg-[#fdfaf2] text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
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
                <tr key={r.id} className="border-t border-[#F1EBDA]">
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
    </div>
  );
}
