import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen } from "lucide-react";

interface PurchaseRow {
  id: string;
  purchased_at: string;
  amount_paid: number;
  currency: string;
  itinerary_products: {
    id: string;
    title: string;
    destination: string;
    duration_days: number;
    cover_image_url: string | null;
  } | null;
}

export default function MyPurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("itinerary_purchases")
      .select(
        "id, purchased_at, amount_paid, currency, itinerary_products(id, title, destination, duration_days, cover_image_url)"
      )
      .eq("buyer_id", user.id)
      .order("purchased_at", { ascending: false })
      .then(({ data }) => {
        setPurchases((data as unknown as PurchaseRow[]) || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <main className="min-h-screen bg-[#f7f3ea]">
      <Helmet><title>My Purchases — Goldsainte</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="w-12 h-0.5 bg-[#C7A962] mb-4" />
        <p className="font-primary text-xs uppercase tracking-[0.25em] text-[#C7A962]">Library</p>
        <h1 className="mt-2 font-secondary text-3xl md:text-4xl text-[#0a2225]">My Purchases</h1>
        <p className="mt-2 text-sm text-[#6B7280]">Itinerary guides you've purchased. Access them anytime.</p>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white border border-[#E5DFC6] animate-pulse" />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="rounded-2xl border border-[#E5DFC6] bg-white p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-[#C7A962]" />
              <h2 className="mt-3 font-secondary text-xl text-[#0a2225]">No purchases yet</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Browse the marketplace to find itinerary guides from travel creators.</p>
              <Link
                to="/marketplace?tab=itinerary-guides"
                className="inline-flex mt-5 rounded-full bg-[#0c4d47] text-white text-sm px-5 py-2.5"
              >
                Browse Guides
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {purchases.map((p) => {
                const guide = p.itinerary_products;
                if (!guide) return null;
                return (
                  <li key={p.id}>
                    <Link
                      to={`/itinerary-guide/${guide.id}`}
                      className="flex items-center gap-4 rounded-2xl bg-white border border-[#E5DFC6] p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-[#E5DFC6]">
                        {guide.cover_image_url && (
                          <img src={guide.cover_image_url} alt={guide.title} className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-secondary text-base text-[#0a2225] truncate">{guide.title}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">{guide.destination} · {guide.duration_days} days</p>
                        <p className="text-[11px] text-[#6B7280] mt-1">
                          Purchased {new Date(p.purchased_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="hidden sm:inline text-sm text-[#0c4d47]">View Guide →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}