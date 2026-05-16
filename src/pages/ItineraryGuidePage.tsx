import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useTrackView } from "@/hooks/useTrackView";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, MapPin, Clock, CheckCircle2, ShieldCheck, Lock, Download } from "lucide-react";
import { toast } from "sonner";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { BackButton } from "@/components/ui/BackButton";
import { ShareButton } from "@/components/ShareButton";
import { generateGuidePdf } from "@/utils/generateGuidePdf";
import { trackPurchaseConversionOnce } from "@/lib/analytics/conversions";
import { getStoredGclid } from "@/lib/analytics/gclid";

type Day = {
  day_number: number;
  title: string;
  description?: string;
  activities?: string[];
  accommodation?: string;
};

interface Guide {
  id: string;
  creator_id: string;
  title: string;
  destination: string;
  duration_days: number;
  price: number;
  currency: string;
  cover_image_url: string | null;
  description: string | null;
  days: Day[];
  status: string;
}

interface CreatorMini {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function ItineraryGuidePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const previewMode = searchParams.get("preview") === "1";
  const purchasedFlag = searchParams.get("purchased") === "true";
  const checkoutSessionId = searchParams.get("session_id");
  useTrackView("product", id);
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [creator, setCreator] = useState<CreatorMini | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("itinerary_products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        // Allow if published or owned by viewer (preview)
        if (data.status === "published" || (user && data.creator_id === user.id)) {
          const g = { ...data, days: (Array.isArray(data.days) ? data.days : []) as Day[] } as Guide;
          setGuide(g);
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, bio")
            .eq("id", g.creator_id)
            .maybeSingle();
          setCreator(prof as CreatorMini | null);
        }
      }
      setLoading(false);
    })();
  }, [id, user?.id]);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("itinerary_purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("product_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setHasPurchased(true);
      });
  }, [user, id]);

  const isOwner = !!user && !!guide && guide.creator_id === user.id;
  const unlocked = previewMode ? false : (hasPurchased || isOwner);

  const handleCheckout = async () => {
    if (!guide) return;
    if (!user) {
      toast.error("Please sign in to purchase this guide.");
      return;
    }
    try {
      setCheckingOut(true);
      const origin = window.location.origin;
      const { getActiveAffiliateRef } = await import("@/hooks/useAffiliateRef");
      const affiliateCode = getActiveAffiliateRef() || undefined;
      const { data, error } = await invokeWithAuth<{ checkoutUrl: string }>(
        "itinerary-checkout",
        {
          body: {
            itineraryProductId: guide.id,
            successUrl: `${origin}/itinerary-guide/${guide.id}?purchased=true&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/itinerary-guide/${guide.id}`,
            affiliateCode,
            gclid: getStoredGclid() || undefined,
          },
        }
      );
      if (error || !data?.checkoutUrl) throw new Error(error || "Checkout unavailable");
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
      setCheckingOut(false);
    }
  };

  const priceLabel = useMemo(() => {
    if (!guide) return "";
    return `${guide.currency === "USD" ? "$" : ""}${Number(guide.price).toFixed(0)} ${guide.currency}`;
  }, [guide]);

  // Fire Google Ads purchase conversion once per checkout session
  useEffect(() => {
    if (!purchasedFlag || !checkoutSessionId || !guide?.price) return;
    trackPurchaseConversionOnce(checkoutSessionId, {
      value: Number(guide.price),
      currency: guide.currency || "USD",
      transactionId: checkoutSessionId,
      productType: "itinerary",
    });
  }, [purchasedFlag, checkoutSessionId, guide?.price, guide?.currency]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0c4d47]" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="text-center">
          <p className="font-secondary text-2xl text-[#0a2225]">Guide not found</p>
          <p className="mt-2 text-sm text-[#6B7280]">It may have been unpublished or removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <Helmet>
        <title>{guide.title} — Itinerary Guide</title>
        {guide.description && <meta name="description" content={guide.description.slice(0, 155)} />}
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between gap-2">
          <BackButton to="/marketplace?tab=itinerary-guides" />
          <ShareButton
            url={`/itinerary-guide/${guide.id}`}
            title={guide.title}
            description={guide.destination}
          />
        </div>
      </div>

      {/* Cover */}
      {guide.cover_image_url && (
        <div className="w-full max-h-[380px] overflow-hidden bg-[#E5DFC6]">
          <img
            src={guide.cover_image_url}
            alt={guide.title}
            className="w-full h-[380px] object-cover"
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {hasPurchased && (
          <div className="mb-6 rounded-xl border border-[#0c4d47]/30 bg-[#0c4d47]/5 px-4 py-3 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#0c4d47] mt-0.5" />
            <p className="text-sm text-[#0a2225]">
              You've unlocked this guide! The full itinerary is now visible below.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT — main content */}
          <div className="lg:col-span-2">
            <div className="w-12 h-0.5 bg-[#C7A962] mb-4" />
            <p className="font-primary text-xs uppercase tracking-[0.25em] text-[#C7A962]">
              Itinerary Guide
            </p>
            <h1 className="mt-3 font-secondary text-3xl md:text-[36px] leading-tight text-[#0a2225]">
              {guide.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E5DFC6] px-3 py-1 text-xs text-[#0a2225]">
                <MapPin className="h-3.5 w-3.5 text-[#C7A962]" /> {guide.destination}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E5DFC6] px-3 py-1 text-xs text-[#0a2225]">
                <Clock className="h-3.5 w-3.5 text-[#C7A962]" /> {guide.duration_days} days
              </span>
            </div>

            {guide.description && (
              <p className="mt-6 text-[15px] leading-relaxed text-[#3a3a3a]">
                {guide.description}
              </p>
            )}

            <div className="mt-10 relative">
              <h2 className="font-secondary text-2xl text-[#0a2225] mb-4">Day by day</h2>
              <div className={!unlocked ? "relative" : ""}>
                <div className={!unlocked ? "blur-sm pointer-events-none select-none" : ""}>
                  <Accordion type="single" collapsible className="space-y-2">
                    {guide.days.map((d, i) => (
                      <AccordionItem
                        key={i}
                        value={`d-${i}`}
                        className="rounded-xl border border-[#E5DFC6] bg-white overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c4d47] text-sm font-semibold text-white">
                              {d.day_number}
                            </span>
                            <span className="font-medium text-[#0a2225]">
                              {d.title || `Day ${d.day_number}`}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 border-t border-[#E5DFC6]/50 bg-[#FDF9F0]/30">
                          {d.description && (
                            <p className="text-sm text-[#4a4a4a] leading-relaxed mt-3">
                              {d.description}
                            </p>
                          )}
                          {d.activities && d.activities.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {d.activities.map((a, ai) => (
                                <li key={ai} className="text-sm text-[#0a2225] flex gap-2">
                                  <span className="text-[#C7A962]">•</span> {a}
                                </li>
                              ))}
                            </ul>
                          )}
                          {d.accommodation && (
                            <p className="mt-3 text-xs text-[#6B7280]">
                              <span className="uppercase tracking-wider">Stay:</span> {d.accommodation}
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-2xl bg-white/95 border border-[#E5DFC6] px-6 py-5 text-center shadow-sm max-w-sm">
                      <Lock className="h-5 w-5 text-[#C7A962] mx-auto" />
                      <p className="mt-2 font-secondary text-lg text-[#0a2225]">Unlock the full guide</p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Purchase to reveal the complete day-by-day itinerary.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              {creator && (
                <div className="rounded-2xl bg-white border border-[#E5DFC6] p-4 flex items-center gap-3">
                  {creator.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      alt={creator.full_name || "Creator"}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#E5DFC6]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0a2225] truncate">
                      {creator.full_name || "Creator"}
                    </p>
                    <Link
                      to={`/creators/${creator.id}`}
                      className="text-xs text-[#0c4d47] underline-offset-2 hover:underline"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white border border-[#E5DFC6] p-5">
                <p className="font-secondary text-3xl text-[#0a2225]">{priceLabel}</p>
                <Button
                  onClick={handleCheckout}
                  disabled={checkingOut || unlocked}
                  className="mt-4 w-full rounded-full bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white h-11"
                >
                  {unlocked ? (
                    "You own this guide"
                  ) : checkingOut ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…</>
                  ) : (
                    "Get This Guide"
                  )}
                </Button>

              {unlocked && (
                <Button
                  variant="outline"
                  onClick={() =>
                    generateGuidePdf({
                      title: guide.title,
                      destination: guide.destination,
                      duration_days: guide.duration_days,
                      description: guide.description,
                      days: guide.days,
                      creatorName: creator?.full_name ?? null,
                    })
                  }
                  className="mt-3 w-full rounded-full border-[#0c4d47]/30 text-[#0c4d47] hover:bg-[#0c4d47]/5 h-11"
                >
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              )}

                <div className="mt-5 border-t border-[#E5DFC6] pt-4">
                  <p className="text-[11px] uppercase tracking-wider text-[#6B7280] font-medium">
                    What's inside
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[#0a2225]">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#0c4d47] mt-0.5" /> Full day-by-day itinerary</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#0c4d47] mt-0.5" /> Accommodation recommendations</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#0c4d47] mt-0.5" /> Local activities & tips</li>
                  </ul>
                </div>

                <p className="mt-5 text-[11px] text-[#6B7280] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Secure payment via Stripe
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}