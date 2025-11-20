import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Sparkles, Bookmark, MessageCircle } from "lucide-react";

interface StatRow {
  collection_id: string;
  title: string;
  views_count: number;
  saves_count: number;
  trip_inquiries_count: number;
  last_engagement_at: string | null;
}

export function CollectionStatsWidget({ brandProfileId }: { brandProfileId: string }) {
  const [rows, setRows] = useState<StatRow[]>([]);

  useEffect(() => {
    if (!brandProfileId) return;

    const load = async () => {
      const { data } = await supabase
        .from("brand_collections")
        .select(
          "id, title, collection_stats(views_count, saves_count, trip_inquiries_count, last_engagement_at)"
        )
        .eq("brand_profile_id", brandProfileId)
        .order("sort_order", { ascending: true });

      const mapped: StatRow[] = (data ?? []).map((row: any) => ({
        collection_id: row.id,
        title: row.title,
        views_count: row.collection_stats?.views_count ?? 0,
        saves_count: row.collection_stats?.saves_count ?? 0,
        trip_inquiries_count: row.collection_stats?.trip_inquiries_count ?? 0,
        last_engagement_at: row.collection_stats?.last_engagement_at ?? null,
      }));

      setRows(mapped);
    };

    void load();
  }, [brandProfileId]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.views += row.views_count;
        acc.saves += row.saves_count;
        acc.inquiries += row.trip_inquiries_count;
        return acc;
      },
      { views: 0, saves: 0, inquiries: 0 }
    );
  }, [rows]);

  return (
    <Card className="rounded-3xl border-[#E5DFC6] bg-white">
      <CardHeader className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Performance</p>
        <CardTitle className="text-xl text-[#0a2225]">Collection stats</CardTitle>
        <p className="text-sm text-[#4a4a4a]">A quick pulse on what travelers are engaging with.</p>
      </CardHeader>
      <CardContent className="space-y-4 text-[11px] text-[#4a4a4a]">
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="Views" value={totals.views} icon={<Sparkles className="h-4 w-4" />} trend={getTrend(rows, "views_count")} />
          <SummaryCard label="Saves" value={totals.saves} icon={<Bookmark className="h-4 w-4" />} trend={getTrend(rows, "saves_count")} />
          <SummaryCard label="Trip inquiries" value={totals.inquiries} icon={<MessageCircle className="h-4 w-4" />} trend={getTrend(rows, "trip_inquiries_count")} />
        </div>

        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-[#4a4a4a]">No collections yet. Create one to see performance.</p>
          ) : (
            rows.map((row) => (
              <div
                key={row.collection_id}
                className="flex flex-col gap-2 rounded-2xl border border-[#E5DFC6] bg-[#F5F0E0]/50 px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0a2225]">{row.title}</p>
                  <p className="text-[10px] text-[#7A7151]">
                    Last engagement {row.last_engagement_at ? new Date(row.last_engagement_at).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-[#0a2225]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                    <Sparkles className="h-3 w-3 text-[#7A7151]" /> {row.views_count} views
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                    <Bookmark className="h-3 w-3 text-[#7A7151]" /> {row.saves_count} saves
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                    <MessageCircle className="h-3 w-3 text-[#7A7151]" /> {row.trip_inquiries_count} inquiries
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend: "up" | "down" | "flat";
}) {
  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-[#F5F0E0]/50 p-3 space-y-1">
      <div className="flex items-center justify-between text-[11px] text-[#7A7151]">
        <span className="inline-flex items-center gap-1">{icon} {label}</span>
        {trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-600" />}
        {trend === "down" && <ArrowDownRight className="h-3 w-3 text-rose-600" />}
      </div>
      <p className="text-lg font-semibold text-[#0a2225]">{value}</p>
    </div>
  );
}

function getTrend(rows: StatRow[], key: keyof Pick<StatRow, "views_count" | "saves_count" | "trip_inquiries_count">) {
  if (rows.length < 2) return "flat" as const;
  const first = rows[0]?.[key] ?? 0;
  const last = rows[rows.length - 1]?.[key] ?? 0;
  if (last > first) return "up" as const;
  if (last < first) return "down" as const;
  return "flat" as const;
}

