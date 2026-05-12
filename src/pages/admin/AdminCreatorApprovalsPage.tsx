import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface PendingCreator {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  creator_niches: string[] | null;
  creator_status: string;
  created_at: string;
}

export default function AdminCreatorApprovalsPage() {
  const [creators, setCreators] = useState<PendingCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, bio, avatar_url, tiktok_handle, instagram_handle, creator_niches, creator_status, created_at")
      .eq("account_type", "creator")
      .eq("creator_status", filter)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load creators");
    setCreators((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    setBusyId(id);
    const { data: auth } = await supabase.auth.getUser();
    const patch: any = {
      creator_status: decision,
      creator_approved_at: decision === "approved" ? new Date().toISOString() : null,
      creator_approved_by: auth.user?.id ?? null,
    };
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error("Update failed: " + error.message);
      return;
    }
    toast.success(decision === "approved" ? "Creator approved" : "Creator rejected");
    setCreators((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-[24px] mb-2">Creator approvals</h1>
        <p className="text-sm text-[#4a4a4a] mb-6">Review and approve new creators before they can publish paid content.</p>

        <div className="flex gap-2 mb-6">
          {(["pending", "approved", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm border ${filter === f ? "bg-[#0c4d47] text-white border-[#0c4d47]" : "bg-white border-[#E5DFC6] text-[#0a2225]"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading…</p>
        ) : creators.length === 0 ? (
          <p className="text-sm text-[#4a4a4a]">No {filter} creators.</p>
        ) : (
          <div className="space-y-4">
            {creators.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#E5DFC6] bg-white p-5 flex gap-4">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#FDF9F0]" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{c.full_name || c.username || "Unnamed creator"}</p>
                  <p className="text-xs text-[#9A9384]">
                    {[c.instagram_handle && `IG: @${c.instagram_handle}`, c.tiktok_handle && `TT: @${c.tiktok_handle}`].filter(Boolean).join(" · ") || "No social handles"}
                  </p>
                  {c.bio && <p className="text-sm mt-2 text-[#4a4a4a] line-clamp-3">{c.bio}</p>}
                  {c.creator_niches?.length ? (
                    <p className="text-xs mt-2 text-[#0c4d47]">{c.creator_niches.join(" · ")}</p>
                  ) : null}
                </div>
                {filter === "pending" && (
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => decide(c.id, "approved")} disabled={busyId === c.id}
                      className="rounded-full bg-[#0c4d47] hover:bg-[#073331] text-white">
                      {busyId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" />Approve</>}
                    </Button>
                    <Button onClick={() => decide(c.id, "rejected")} disabled={busyId === c.id} variant="outline"
                      className="rounded-full border-[#E5DFC6]">
                      <XCircle className="h-4 w-4 mr-2" />Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}