import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { TrendingUp, Eye, MousePointerClick, Trophy } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Range = 7 | 30 | 90;

interface ProductRow {
  id: string;
  title: string;
  view_count: number | null;
  booking_count?: number | null;
  created_at: string;
}

interface SaleRow {
  created_at: string;
  amount: number;
  source: string | null;
}

export function CreatorPerformanceTab({ role = "creator" }: { role?: "creator" | "agent" }) {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>(30);
  const [trips, setTrips] = useState<ProductRow[]>([]);
  const [guides, setGuides] = useState<ProductRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const sinceIso = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();
      const partnerCol = role === "agent" ? "agent_id" : "creator_id";

      const [tripRes, guideRes, bookingRes, purchaseRes] = await Promise.all([
        supabase
          .from("packaged_trips")
          .select("id, title, view_count, booking_count, created_at")
          .eq(partnerCol, user.id)
          .order("view_count", { ascending: false })
          .limit(50),
        supabase
          .from("itinerary_products")
          .select("id, title, view_count, created_at")
          .eq("creator_id", user.id)
          .order("view_count", { ascending: false })
          .limit(50),
        supabase
          .from("trip_bookings")
          .select("created_at, total_price, metadata")
          .eq("partner_id", user.id)
          .gte("created_at", sinceIso),
        supabase
          .from("itinerary_purchases")
          .select("purchased_at, amount_paid, product_id, itinerary_products!inner(creator_id)")
          .eq("itinerary_products.creator_id", user.id)
          .gte("purchased_at", sinceIso),
      ]);

      if (cancelled) return;
      setTrips((tripRes.data as any) || []);
      setGuides((guideRes.data as any) || []);
      const merged: SaleRow[] = [
        ...((bookingRes.data as any[]) || []).map((b) => ({
          created_at: b.created_at,
          amount: Number(b.total_price || 0),
          source: (b.metadata as any)?.utm_source || null,
        })),
        ...((purchaseRes.data as any[]) || []).map((p) => ({
          created_at: p.purchased_at,
          amount: Number(p.amount_paid || 0),
          source: null,
        })),
      ];
      setSales(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, role, range]);

  const totalViews = useMemo(
    () =>
      [...trips, ...guides].reduce((acc, p) => acc + (p.view_count || 0), 0),
    [trips, guides],
  );
  const totalSales = sales.length;
  const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

  const topPerformer = useMemo(() => {
    const all = [...trips, ...guides];
    if (!all.length) return null;
    return all.reduce((best, cur) => ((cur.view_count || 0) > (best.view_count || 0) ? cur : best));
  }, [trips, guides]);

  const chartData = useMemo(() => {
    const days: { date: string; sales: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key.slice(5), sales: 0 });
    }
    sales.forEach((s) => {
      const key = s.created_at.slice(5, 10);
      const slot = days.find((d) => d.date === key);
      if (slot) slot.sales += 1;
    });
    return days;
  }, [sales, range]);

  const sources = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      const key = s.source || "direct";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sales]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-secondary text-xl text-[#0a2225]">Performance</h2>
        <div className="flex gap-1 rounded-full bg-[#FDF9F0] p-1 ring-1 ring-[#E5DFC6] self-start sm:self-auto">
          {([7, 30, 90] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-[12px] whitespace-nowrap transition ${
                range === r ? "bg-[#0c4d47] text-white" : "text-[#0a2225]"
              }`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Eye className="h-4 w-4" />} label="Total views" value={totalViews.toLocaleString()} />
        <Stat icon={<MousePointerClick className="h-4 w-4" />} label="Sales" value={totalSales.toLocaleString()} />
        <Stat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Conversion"
          value={`${conversionRate.toFixed(2)}%`}
          subtitle="Industry average: 1.2%"
        />
        <Stat
          icon={<Trophy className="h-4 w-4" />}
          label="Top product"
          value={topPerformer?.title || "—"}
          truncate
        />
      </div>

      <Card className="p-5">
        <p className="mb-3 text-[12px] uppercase tracking-wider text-[#7A7151]">Sales by day</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DFC6" />
              <XAxis dataKey="date" stroke="#7A7151" fontSize={11} />
              <YAxis
                stroke="#7A7151"
                fontSize={11}
                allowDecimals={false}
                hide={typeof window !== 'undefined' && window.innerWidth < 640}
              />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#0c4d47" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-[12px] uppercase tracking-wider text-[#7A7151]">Traffic sources (UTM)</p>
        {sources.length === 0 ? (
          <p className="text-sm text-[#6B7280]">
            No traffic data yet. Share links with <code>?utm_source=...</code> to track.
          </p>
        ) : (
          <ul className="divide-y divide-[#E5DFC6]/60">
            {sources.map(([src, count]) => (
              <li key={src} className="flex items-center justify-between py-2 text-sm">
                <span className="capitalize text-[#0a2225]">{src}</span>
                <span className="text-[#6B7280]">{count} sale{count === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {loading && <p className="text-xs text-[#7A7151]">Loading…</p>}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  truncate,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
  subtitle?: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#7A7151]">
        {icon}
        {label}
      </div>
      <p className={`font-secondary text-lg text-[#0a2225] ${truncate ? "truncate" : ""}`}>{value}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-[#7A7151]">{subtitle}</p>}
    </Card>
  );
}