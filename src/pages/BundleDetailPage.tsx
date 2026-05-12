import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ShareButton";
import { Loader2, Layers } from "lucide-react";
import NotFound from "@/pages/NotFound";
import { getActiveAffiliateRef } from "@/hooks/useAffiliateRef";

export default function BundleDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [guides, setGuides] = useState<any[]>([]);
  const [creator, setCreator] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: b } = await supabase
        .from("product_bundles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancel) return;
      if (!b) {
        setBundle(null);
        setLoading(false);
        return;
      }
      setBundle(b);
      const [tripRes, guidesRes, creatorRes] = await Promise.all([
        b.trip_id
          ? supabase
              .from("packaged_trips")
              .select("id, title, destination, cover_image_url, price_per_person, currency, duration_days")
              .eq("id", b.trip_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        b.guide_ids?.length
          ? supabase
              .from("itinerary_products")
              .select("id, title, destination, cover_image_url, price, currency, duration_days")
              .in("id", b.guide_ids)
          : Promise.resolve({ data: [] }),
        supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .eq("id", b.creator_id)
          .maybeSingle(),
      ]);
      if (cancel) return;
      setTrip(tripRes.data);
      setGuides(guidesRes.data || []);
      setCreator(creatorRes.data);
      setLoading(false);
      // increment view
      supabase
        .from("product_bundles")
        .update({ view_count: (b.view_count || 0) + 1 })
        .eq("id", b.id)
        .then(() => {});
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const checkout = async () => {
    if (!user) {
      toast.error("Please sign in to purchase this bundle.");
      return;
    }
    if (!bundle) return;
    setBusy(true);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke<{ checkoutUrl: string }>(
        "bundle-checkout",
        {
          body: {
            bundleId: bundle.id,
            successUrl: `${origin}/bundle/${bundle.id}?payment=success`,
            cancelUrl: `${origin}/bundle/${bundle.id}?payment=cancelled`,
            affiliateCode: getActiveAffiliateRef() || undefined,
          },
        }
      );
      if (error || !data?.checkoutUrl) throw new Error(error?.message || "Checkout unavailable");
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#0c4d47]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!bundle || (bundle.status !== "published" && bundle.creator_id !== user?.id)) {
    return <NotFound />;
  }

  const fmt = (val: number, cur?: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur || bundle.currency || "USD",
      maximumFractionDigits: 0,
    }).format(val);

  const sum =
    Number(trip?.price_per_person || 0) +
    guides.reduce((s, g) => s + Number(g.price || 0), 0);
  const savings = sum - Number(bundle.price);

  return (
    <div className="min-h-screen bg-[#F7F3EA]">
      <Helmet>
        <title>{bundle.title} — Bundle — Goldsainte</title>
        <meta name="description" content={bundle.description?.slice(0, 155) || `Bundle by ${creator?.full_name || "a creator"}`} />
        {bundle.cover_image_url && <meta property="og:image" content={bundle.cover_image_url} />}
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#0c4d47]/10">
            {bundle.cover_image_url ? (
              <img src={bundle.cover_image_url} alt={bundle.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#C7A962]">
                <Layers className="h-16 w-16" />
              </div>
            )}
          </div>

          <div>
            <span className="inline-block rounded-full bg-[#0c4d47] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Bundle
            </span>
            <h1 className="mt-3 font-secondary text-3xl text-[#0a2225]">{bundle.title}</h1>
            {creator && (
              <Link
                to={creator.username ? `/@${creator.username}/shop` : "#"}
                className="mt-2 block text-sm text-[#0c4d47] hover:underline"
              >
                by {creator.full_name}
              </Link>
            )}
            {bundle.description && (
              <p className="mt-4 text-sm leading-relaxed text-[#0a2225]/80">{bundle.description}</p>
            )}

            <div className="mt-6 rounded-2xl border border-[#E5DFC6] bg-white p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-semibold text-[#0a2225]">{fmt(Number(bundle.price))}</p>
                {savings > 0 && (
                  <p className="text-xs text-[#0c4d47]">
                    Save {fmt(savings)} vs separately
                  </p>
                )}
              </div>
              <Button
                onClick={checkout}
                disabled={busy}
                className="mt-4 w-full bg-[#0c4d47] text-white hover:bg-[#0c4d47]/90"
              >
                {busy ? "Loading…" : "Get Bundle"}
              </Button>
              <div className="mt-3 flex justify-center">
                <ShareButton url={`/bundle/${bundle.id}`} title={bundle.title} description={bundle.description || undefined} />
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="font-secondary text-xl text-[#0a2225]">What's included</h2>
          <div className="mt-4 space-y-3">
            {trip && (
              <Link
                to={`/marketplace/trip/${trip.id}`}
                className="flex items-center gap-4 rounded-xl border border-[#E5DFC6] bg-white p-4 hover:shadow"
              >
                {trip.cover_image_url && (
                  <img src={trip.cover_image_url} alt={trip.title} className="h-20 w-20 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#C7A962]">Trip</p>
                  <p className="font-secondary text-base text-[#0a2225]">{trip.title}</p>
                  <p className="text-xs text-[#6B7280]">{trip.destination}</p>
                </div>
                <p className="text-sm text-[#6B7280]">{fmt(Number(trip.price_per_person), trip.currency)}</p>
              </Link>
            )}
            {guides.map((g) => (
              <Link
                key={g.id}
                to={`/itinerary-guide/${g.id}`}
                className="flex items-center gap-4 rounded-xl border border-[#E5DFC6] bg-white p-4 hover:shadow"
              >
                {g.cover_image_url && (
                  <img src={g.cover_image_url} alt={g.title} className="h-20 w-20 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#C7A962]">Guide</p>
                  <p className="font-secondary text-base text-[#0a2225]">{g.title}</p>
                  <p className="text-xs text-[#6B7280]">{g.destination}</p>
                </div>
                <p className="text-sm text-[#6B7280]">{fmt(Number(g.price), g.currency)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}