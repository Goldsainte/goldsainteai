import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link2, DollarSign, MousePointer, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

type LinkRow = {
  id: string;
  product_name: string;
  product_url: string;
  affiliate_code: string;
  clicks: number | null;
  conversions: number | null;
  total_earnings: number | null;
  is_active: boolean | null;
  created_at: string;
};

type Commission = {
  id: string;
  commission_amount: number;
  currency: string;
  status: string;
  created_at: string;
};

type Product = { id: string; title: string; slug?: string | null; kind: "trip" | "guide"; creator_username?: string | null };

function genCode() {
  return Math.random().toString(36).slice(2, 10);
}

function buildShareUrl(p: Product, code: string): string {
  const origin = "https://goldsainte.ai";
  if (p.kind === "trip") return `${origin}/marketplace/trip/${p.slug || p.id}?ref=${code}`;
  return `${origin}/itinerary-guides/${p.id}?ref=${code}`;
}

export function CreatorAffiliateTab() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [linksRes, commRes, tripsRes, guidesRes] = await Promise.all([
        supabase
          .from("affiliate_links")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("affiliate_commissions")
          .select("id, commission_amount, currency, status, created_at")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("packaged_trips")
          .select("id, title, slug")
          .eq("status", "published")
          .limit(50),
        supabase
          .from("itinerary_products")
          .select("id, title")
          .eq("status", "published")
          .limit(50),
      ]);
      if (cancelled) return;
      setLinks((linksRes.data as any) || []);
      setCommissions((commRes.data as any) || []);
      const merged: Product[] = [
        ...((tripsRes.data as any[]) || []).map((t) => ({ ...t, kind: "trip" as const })),
        ...((guidesRes.data as any[]) || []).map((g) => ({ ...g, kind: "guide" as const })),
      ];
      setProducts(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (!productQuery) return products.slice(0, 12);
    const q = productQuery.toLowerCase();
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 12);
  }, [productQuery, products]);

  const totalEarnings = commissions.reduce((acc, c) => acc + Number(c.commission_amount || 0), 0);
  const totalClicks = links.reduce((a, l) => a + (l.clicks || 0), 0);
  const totalConv = links.reduce((a, l) => a + (l.conversions || 0), 0);

  const productBreakdown = useMemo(() => {
    const map = new Map<string, { product: string; clicks: number; conversions: number; earnings: number }>();
    for (const l of links) {
      const key = l.product_name || "Untitled";
      const cur = map.get(key) || { product: key, clicks: 0, conversions: 0, earnings: 0 };
      cur.clicks += l.clicks || 0;
      cur.conversions += l.conversions || 0;
      cur.earnings += Number(l.total_earnings || 0);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [links]);

  async function createLink(p: Product) {
    if (!user?.id) return;
    const code = genCode();
    const url = buildShareUrl(p, code);
    const { data, error } = await supabase
      .from("affiliate_links")
      .insert({
        creator_id: user.id,
        product_name: p.title,
        product_url: url,
        affiliate_code: code,
        commission_rate: 10.0,
        platform: p.kind,
      })
      .select()
      .single();
    if (error) {
      toast.error("Could not create link");
      return;
    }
    setLinks((prev) => [data as any, ...prev]);
    setSelectedProduct(null);
    toast.success("Affiliate link created");
  }

  async function copy(linkId: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat icon={<DollarSign className="h-4 w-4" />} label="Referral earnings" value={`$${totalEarnings.toFixed(2)}`} />
        <Stat icon={<MousePointer className="h-4 w-4" />} label="Clicks" value={totalClicks.toLocaleString()} />
        <Stat icon={<ShoppingBag className="h-4 w-4" />} label="Conversions" value={totalConv.toLocaleString()} />
      </div>

      <Card className="p-5">
        <h3 className="mb-1 font-secondary text-lg text-[#0a2225]">Generate referral link</h3>
        <p className="mb-3 text-sm text-[#6B7280]">
          Earn 10% of platform commission on every booking driven through your link.
        </p>
        <Input
          placeholder="Search any trip or guide…"
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
          className="mb-3"
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {filtered.map((p) => (
            <button
              key={`${p.kind}-${p.id}`}
              onClick={() => createLink(p)}
              className="flex items-center justify-between rounded-xl border border-[#E5DFC6] bg-white p-3 text-left transition hover:border-[#0c4d47]"
            >
              <div>
                <p className="line-clamp-1 text-sm text-[#0a2225]">{p.title}</p>
                <p className="text-[11px] uppercase tracking-wider text-[#7A7151]">{p.kind}</p>
              </div>
              <Link2 className="h-4 w-4 text-[#0c4d47]" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-sm text-[#6B7280]">No products match.</p>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-secondary text-lg text-[#0a2225]">Your referral links</h3>
        {loading ? (
          <p className="text-sm text-[#7A7151]">Loading…</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-[#6B7280]">You haven't created any links yet.</p>
        ) : (
          <ul className="divide-y divide-[#E5DFC6]/60">
            {links.map((l) => (
              <li key={l.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0a2225]">{l.product_name}</p>
                  <p className="truncate font-mono text-[11px] text-[#6B7280]">{l.product_url}</p>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-[#7A7151]">
                  <span>{l.clicks ?? 0} clicks</span>
                  <span>·</span>
                  <span>{l.conversions ?? 0} sales</span>
                  <span>·</span>
                  <span>${Number(l.total_earnings ?? 0).toFixed(2)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(l.id, l.product_url)}
                    className="ml-2"
                  >
                    {copiedId === l.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-secondary text-lg text-[#0a2225]">Recent commissions</h3>
        {commissions.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No commissions yet.</p>
        ) : (
          <ul className="divide-y divide-[#E5DFC6]/60">
            {commissions.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-[#7A7151]">{new Date(c.created_at).toLocaleDateString()}</span>
                <span className="text-[#0a2225]">
                  {c.currency} {Number(c.commission_amount).toFixed(2)}
                </span>
                <span className="rounded-full bg-[#FDF9F0] px-2 py-0.5 text-[11px] uppercase tracking-wider text-[#0c4d47]">
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-secondary text-lg text-[#0a2225]">Earnings by product</h3>
        {productBreakdown.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No referral activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#7A7151]">
                  <th className="py-2 pr-3 font-normal">Product</th>
                  <th className="py-2 pr-3 text-right font-normal">Clicks</th>
                  <th className="py-2 pr-3 text-right font-normal">Conversions</th>
                  <th className="py-2 text-right font-normal">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFC6]/60">
                {productBreakdown.map((row) => (
                  <tr key={row.product}>
                    <td className="py-2 pr-3 text-[#0a2225]">{row.product}</td>
                    <td className="py-2 pr-3 text-right text-[#0a2225]">{row.clicks.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right text-[#0a2225]">{row.conversions.toLocaleString()}</td>
                    <td className="py-2 text-right font-medium text-[#0c4d47]">${row.earnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#7A7151]">
        {icon}
        {label}
      </div>
      <p className="font-secondary text-lg text-[#0a2225]">{value}</p>
    </Card>
  );
}