import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Eye, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

type Guide = {
  id: string;
  title: string;
  destination: string;
  price: number;
  currency: string;
  status: string;
  cover_image_url: string | null;
};

type RecentPurchase = {
  id: string;
  amount_paid: number;
  currency: string;
  created_at: string;
  buyerName: string;
  guideTitle: string;
};

export function CreatorGuidesTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesCount, setSalesCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("itinerary_products")
      .select("id, title, destination, price, currency, status, cover_image_url")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    const guideList = (data as Guide[]) || [];
    setGuides(guideList);

    const guideIds = guideList.map((g) => g.id);
    if (guideIds.length > 0) {
      const { data: purchases } = await supabase
        .from("itinerary_purchases")
        .select("id, amount_paid, currency, created_at, buyer_id, product_id")
        .in("product_id", guideIds)
        .order("created_at", { ascending: false });

      const list = (purchases as any[]) || [];
      setSalesCount(list.length);
      setRevenue(list.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0));

      const buyerIds = Array.from(new Set(list.map((p) => p.buyer_id))).filter(Boolean);
      let buyerMap: Record<string, string> = {};
      if (buyerIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, first_name")
          .in("id", buyerIds);
        for (const p of (profiles as any[]) || []) {
          buyerMap[p.id] = p.first_name || (p.full_name?.split(" ")[0] ?? "Traveler");
        }
      }
      const guideMap: Record<string, string> = {};
      for (const g of guideList) guideMap[g.id] = g.title || "Untitled";

      setRecentPurchases(
        list.slice(0, 10).map((p) => ({
          id: p.id,
          amount_paid: Number(p.amount_paid) || 0,
          currency: p.currency || "USD",
          created_at: p.created_at,
          buyerName: buyerMap[p.buyer_id] || "Traveler",
          guideTitle: guideMap[p.product_id] || "Guide",
        }))
      );
    } else {
      setSalesCount(0);
      setRevenue(0);
      setRecentPurchases([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this guide? This cannot be undone.")) return;
    const { error } = await supabase.from("itinerary_products").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete: " + error.message);
      return;
    }
    toast.success("Guide deleted");
    setGuides((g) => g.filter((x) => x.id !== id));
  };

  return (
    <div>
      {/* Sales analytics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border border-[#E5DFC6] bg-white rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-[#C7A962] font-medium">Guide Sales</p>
          <p className="font-secondary text-3xl text-[#0a2225] mt-2">{salesCount}</p>
        </Card>
        <Card className="border border-[#E5DFC6] bg-white rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-[#C7A962] font-medium">Guide Revenue</p>
          <p className="font-secondary text-3xl text-[#0a2225] mt-2">${revenue.toLocaleString()}</p>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-secondary text-xl text-[#0a2225]">Your Guides</h2>
        <Button
          onClick={() => navigate("/itinerary-builder")}
          className="rounded-full bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Create New Guide
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#6B7280] text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : guides.length === 0 ? (
        <Card className="border-dashed border-2 border-[#E5DFC6] bg-transparent rounded-2xl p-10 text-center">
          <BookOpen className="h-6 w-6 text-[#C7A962] mx-auto" />
          <p className="mt-3 font-secondary text-lg text-[#0a2225]">No guides yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Package your travel knowledge into a sellable digital guide.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {guides.map((g) => (
            <Card key={g.id} className="border border-[#E5DFC6] bg-white rounded-2xl p-4 flex items-center gap-4">
              {g.cover_image_url ? (
                <img
                  src={g.cover_image_url}
                  alt={g.title}
                  className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-[#E5DFC6] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0a2225] truncate">{g.title || "Untitled"}</p>
                <p className="text-xs text-[#6B7280] mt-0.5 truncate">{g.destination}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm text-[#0a2225]">
                    {g.currency === "USD" ? "$" : ""}{Number(g.price).toFixed(0)} {g.currency}
                  </span>
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider " +
                      (g.status === "published"
                        ? "bg-[#0c4d47]/10 text-[#0c4d47]"
                        : "bg-[#E5DFC6]/60 text-[#6B7280]")
                    }
                  >
                    {g.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to={`/itinerary-builder?edit=${g.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </Link>
                <Link to={`/itinerary-guide/${g.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(g.id)}
                  className="rounded-full text-[#9A9384] hover:text-[#0a2225]"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}