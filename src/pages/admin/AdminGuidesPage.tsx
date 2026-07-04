import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, CheckCircle2, Undo2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";

/**
 * Admin review queue for itinerary guides.
 *
 * Creators/agents who publish from the builder land in `pending_review`;
 * until this page existed, nothing could approve them and they stayed
 * invisible forever. Requires the admin RLS policies added on 2026-07-04
 * (admin SELECT/UPDATE on itinerary_products).
 */

type GuideRow = {
  id: string;
  title: string;
  destination: string;
  price: number;
  currency: string;
  status: string;
  duration_days: number;
  created_at: string;
  creator_id: string;
  creatorName?: string;
};

const STATUSES = ["pending_review", "published", "draft"] as const;

export default function AdminGuidesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("pending_review");
  const [rows, setRows] = useState<GuideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("itinerary_products")
      .select("id, title, destination, price, currency, status, duration_days, created_at, creator_id")
      .eq("status", statusFilter)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load guides: " + error.message);
      setRows([]);
      setLoading(false);
      return;
    }
    const list = (data as GuideRow[]) ?? [];
    const creatorIds = Array.from(new Set(list.map((g) => g.creator_id)));
    let names: Record<string, string> = {};
    if (creatorIds.length) {
      const { data: profs } = await supabase
        .from("creator_directory" as unknown as "profiles")
        .select("id, display_name, username")
        .in("id", creatorIds);
      for (const p of (profs as any[]) ?? []) {
        names[p.id] = p.display_name || p.username || "Unknown creator";
      }
    }
    setRows(list.map((g) => ({ ...g, creatorName: names[g.creator_id] ?? "—" })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const setStatus = async (id: string, status: "published" | "draft") => {
    setActingOn(id);
    const { error } = await supabase
      .from("itinerary_products")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success(status === "published" ? "Guide approved & published." : "Sent back to draft.");
      setRows((r) => r.filter((g) => g.id !== id));
    }
    setActingOn(null);
  };

  return (
    <main className="min-h-screen bg-[#FDF9F0] px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <BackButton to="/admin" />
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#C7A962] font-medium flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Admin
            </p>
            <h1 className="font-secondary text-2xl text-[#0a2225] mt-1">Guide Review</h1>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-white border-[#E5DFC6]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "pending_review" ? "Pending review" : s[0].toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-[#6B7280] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <Card className="mt-8 border-dashed border-2 border-[#E5DFC6] bg-transparent rounded-2xl p-10 text-center">
            <p className="font-secondary text-lg text-[#0a2225]">Nothing here</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              {statusFilter === "pending_review"
                ? "No guides are waiting for review."
                : `No ${statusFilter} guides.`}
            </p>
          </Card>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map((g) => (
              <Card key={g.id} className="border border-[#E5DFC6] bg-white rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-[#0a2225] truncate">{g.title || "Untitled"}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {g.destination} · {g.duration_days} days · {g.currency === "USD" ? "$" : ""}
                    {Number(g.price).toFixed(0)} {g.currency !== "USD" ? g.currency : ""} · by {g.creatorName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild variant="outline" size="sm" className="rounded-full border-[#E5DFC6] text-[#0a2225] hover:bg-[#f7f3ea]">
                    <Link to={`/itinerary-guide/${g.id}`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4 mr-1.5" /> Preview
                    </Link>
                  </Button>
                  {g.status !== "published" && (
                    <Button
                      size="sm"
                      onClick={() => setStatus(g.id, "published")}
                      disabled={actingOn === g.id}
                      className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
                    >
                      {actingOn === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                      Approve
                    </Button>
                  )}
                  {g.status !== "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(g.id, "draft")}
                      disabled={actingOn === g.id}
                      className="rounded-full border-[#E5DFC6] text-[#0a2225] hover:bg-[#f7f3ea]"
                    >
                      <Undo2 className="h-4 w-4 mr-1.5" /> To draft
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
