import { useEffect, useState, useCallback } from "react";
import { Clock, ChevronRight, Plus, PenLine, Star, CirclePlus, MoreVertical, Pencil, Trash2, Shield, Wallet, CalendarCheck, Tag, Check, ArrowRight, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { capLabel, isCapabilityId } from "@/lib/onTripCapabilities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AddServiceDialog } from "./AddServiceDialog";
import { TIER_COMMISSION, type CreatorTier } from "./TierBadge";
import { toast } from "sonner";

type ServiceTier = "custom_itinerary" | "full_trip_design" | "add_on" | "on_trip";

interface Service {
  id: string;
  title: string;
  description: string | null;
  starting_price_cents: number;
  currency: string;
  delivery_days: number | null;
  includes: string[];
  cover_image_url: string | null;
  service_tier: ServiceTier;
  trip_days: number | null;
  has_priority_support: boolean;
  duration_minutes: number | null;
  file_url: string | null;
  delivery_time_option: string | null;
  revisions: number | null;
  requirements: string[];
  faq: { question: string; answer: string }[];
  expense_travel: "traveler" | "creator" | "split" | null;
  expense_lodging: "traveler" | "creator" | "split" | null;
  expense_meals: "traveler" | "creator" | "split" | null;
}

interface Props {
  creatorId: string;
  isOwnProfile?: boolean;
  /** Real value from profiles.creator_tier — drives the accurate "you keep X%" line. Defaults to bronze if absent. */
  creatorTier?: CreatorTier | string | null;
  /** Hide the built-in section label (e.g. inside a dashboard tab that already has one). */
  hideLabel?: boolean;
  /** Public profiles: base query string for the request/hire CTA, e.g.
      "fromCreator=<userId>" or "agentId=<id>&agentName=<name>". When set (and
      not the owner), every service card gets a working CTA into /post-trip. */
  requestBaseParams?: string;
  /** For hosted-trip copy ("Request Jordan for your dates"). */
  firstName?: string;
}

const TIER_CONFIG: Record<ServiceTier, { label: string; icon: any; badge: string; cta: string }> = {
  custom_itinerary: {
    label: "Custom Itineraries",
    icon: PenLine,
    badge: "bg-[#FDF9F0] text-[#0c4d47] border-[#E5DFC6]",
    cta: "Request This",
  },
  full_trip_design: {
    label: "Full Trip Design",
    icon: Star,
    badge: "bg-[#FDF9F0] text-[#0c4d47] border-[#E5DFC6]",
    cta: "Request This",
  },
  add_on: {
    label: "Add-Ons",
    icon: CirclePlus,
    badge: "bg-[#FDF9F0] text-[#0c4d47] border-[#E5DFC6]",
    cta: "Add",
  },
  on_trip: {
    label: "On-Trip \u2014 Travel With You",
    icon: Plane,
    badge: "bg-[#FDF9F0] text-[#0c4d47] border-[#E5DFC6]",
    cta: "Hire for your trip",
  },
};

const TIER_ORDER: ServiceTier[] = ["on_trip", "custom_itinerary", "full_trip_design", "add_on"];

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function CreatorServicesSection({ creatorId, isOwnProfile, creatorTier, hideLabel, requestBaseParams, firstName }: Props) {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [pendingTier, setPendingTier] = useState<ServiceTier | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  // Which hosted (on_trip) offer the public flagship card is showing.
  const [hostedIdx, setHostedIdx] = useState(0);

  const safeTier: CreatorTier = (creatorTier && creatorTier in TIER_COMMISSION ? creatorTier : "bronze") as CreatorTier;
  const youKeepPct = 100 - TIER_COMMISSION[safeTier];

  const fetchServices = useCallback(async () => {
    const { data } = await supabase
      .from("creator_services")
      .select("id, title, description, starting_price_cents, currency, delivery_days, includes, cover_image_url, service_tier, trip_days, has_priority_support, duration_minutes, file_url, delivery_time_option, revisions, requirements, faq, expense_travel, expense_lodging, expense_meals" as any)
      .eq("creator_id", creatorId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    setServices(
      (data || []).map((s: any) => ({
        ...s,
        includes: Array.isArray(s.includes) ? s.includes : [],
        service_tier: s.service_tier || "custom_itinerary",
        has_priority_support: s.has_priority_support || false,
        requirements: Array.isArray(s.requirements) ? s.requirements : [],
        faq: Array.isArray(s.faq) ? s.faq : [],
      }))
    );
    setLoading(false);
  }, [creatorId]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("creator_services").update({ is_active: false }).eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Service removed");
    setMenuOpen(null);
    fetchServices();
  }

  if (loading) return null;

  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<ServiceTier, Service[]>>((acc, t) => {
    acc[t] = services.filter((s) => s.service_tier === t);
    return acc;
  }, {} as any);

  const hasAny = services.length > 0;

  // Public profiles: the on_trip service renders as ONE featured hosted-trip
  // offer (Flytographer-style: outcome, what's included, fee terms up front,
  // three-step ritual, single CTA) instead of a card lost in the tier grid.
  // Owners keep the full grid so they can edit every service in place.
  const hostedServices = !isOwnProfile ? services.filter((s) => s.service_tier === "on_trip") : [];
  const hostedService = hostedServices[Math.min(hostedIdx, Math.max(0, hostedServices.length - 1))];
  const who = firstName || "your host";
  const hostedHireUrl = hostedService && requestBaseParams
    ? `/post-trip?${requestBaseParams}&service=${encodeURIComponent(hostedService.title)}&hire=on-trip&hireRate=${Math.round(hostedService.starting_price_cents / 100)}&serviceId=${hostedService.id}`
    : null;

  // Public + no services: render nothing at all. Big-tech profiles never
  // show an empty module with an apology — the section simply doesn't exist
  // until there's something to sell. (Owners still see the tier picker.)
  if (!hasAny && !isOwnProfile) {
    return null;
  }

  return (
    <div>
      {/* Section label lives here (not in the page) so it can never render
          above an empty module. */}
      {!hideLabel && (
      <div className="flex items-center gap-4 mb-8">
        <span className="font-primary text-sm uppercase tracking-[0.25em] text-[#C7A962] shrink-0">
          Custom Services
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-[#C7A962]/30 to-transparent" />
      </div>
      )}
      {/* Add Service button for owners — only show once they have at least one service */}
      {isOwnProfile && hasAny && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditService(null); setPendingTier(null); setDialogOpen(true); }}
            className="border-[#E5DFC6] text-[#0a2225] rounded-full"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Service
          </Button>
        </div>
      )}

      {hasAny ? (
        <>
        {hostedService && (
          <div className="mb-8 rounded-3xl border border-[#E5DFC6] bg-white p-5 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Travel, hosted</p>
            {hostedServices.length > 1 && (
              <div className="mt-3 inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border border-[#E5DFC6] bg-[#FDF9F0] p-0.5">
                {hostedServices.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setHostedIdx(i)}
                    className={`h-8 max-w-[220px] truncate rounded-md px-3 text-[12px] font-medium transition-colors !min-h-0 !min-w-0 ${
                      i === Math.min(hostedIdx, hostedServices.length - 1)
                        ? "bg-white text-[#0a2225] shadow-sm"
                        : "text-[#0a2225]/60 hover:text-[#0a2225]"
                    }`}
                  >
                    {s.title} · ${Math.round(s.starting_price_cents / 100)}/day
                  </button>
                ))}
              </div>
            )}
            <h3 className="mt-2 font-secondary text-xl leading-tight text-[#0a2225] md:text-2xl">{hostedService.title}</h3>
            <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-[#0a2225]/80 line-clamp-2">
              {hostedService.description ||
                `${who} travels with you \u2014 leading the days and capturing them as you go, so you can put the phone away.`}
            </p>

            {hostedService.includes.length > 0 && (
              <ul className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                {hostedService.includes.slice(0, 3).map((inc) => (
                  <li key={inc} className="flex items-start gap-2 text-[13px] text-[#0a2225]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C7A962]" />
                    <span>{capLabel(inc)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DFC6] pt-4">
              <p className="font-secondary text-2xl text-[#0a2225]">
                From {formatPrice(hostedService.starting_price_cents, hostedService.currency)}
                <span className="ml-1 align-baseline text-base text-[#0a2225]/60">/ day</span>
              </p>
              {hostedHireUrl && (
                <button
                  type="button"
                  onClick={() => navigate(hostedHireUrl)}
                  className="rounded-full bg-[#0c4d47] px-6 py-3 text-[14px] font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225]"
                >
                  Request {who} for your dates
                </button>
              )}
            </div>
            {(hostedService.expense_travel || hostedService.expense_lodging || hostedService.expense_meals) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {([
                  ["Flights & transport", hostedService.expense_travel],
                  ["Lodging", hostedService.expense_lodging],
                  ["Meals", hostedService.expense_meals],
                ] as [string, string | null][]).filter(([, v]) => v).map(([label, v]) => (
                  <span key={label} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#E5DFC6] bg-[#FDF9F0] px-2.5 text-[11px] text-[#0a2225]">
                    <span className="text-[#0a2225]/60">{label}:</span>
                    <span className="font-medium">
                      {v === "traveler" ? "traveler covers" : v === "creator" ? "in the rate" : "each their own"}
                    </span>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-[12px] leading-relaxed text-[#0a2225]/60">
              Final price by proposal — confirmed before you pay.
            </p>

            <div className="mt-4 flex flex-col gap-2 border-t border-[#E5DFC6] pt-4 sm:flex-row sm:items-baseline sm:gap-7">
              {[
                "Request your dates",
                `${who} replies with a proposal`,
                "Book \u2014 held in escrow until the trip",
              ].map((s, i) => (
                <p key={s} className="flex items-baseline gap-2 text-[13px] text-[#0a2225]/80">
                  <span className="font-secondary text-lg leading-none text-[#8D6B2F]">{i + 1}</span>
                  {s}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {TIER_ORDER.map((tierKey) => {
            if (hostedServices.length > 0 && tierKey === "on_trip") return null; // featured above
            const groupNeedsCaps = isOwnProfile && tierKey === "on_trip" &&
              grouped[tierKey]?.some((s) => !s.includes.some((x) => isCapabilityId(x)));
            const items = grouped[tierKey];
            if (items.length === 0) return null;
            const config = TIER_CONFIG[tierKey];
            const TierIcon = config.icon;

            return (
              <div key={tierKey}>
                {/* Tier header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
                    <TierIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>

                {/* Cards row */}
                <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                  {groupNeedsCaps && (
                  <button
                    type="button"
                    onClick={() => {
                      const svc = grouped["on_trip"].find((s) => !s.includes.some((x) => isCapabilityId(x)));
                      if (svc) { setEditService(svc); setDialogOpen(true); }
                    }}
                    className="mb-1 flex w-full items-center justify-between rounded-xl border border-[#C7A962]/60 bg-[#FDF9F0] px-4 py-3 text-left transition-colors hover:border-[#C7A962] !min-h-0"
                  >
                    <span className="text-[13px] text-[#0a2225]">
                      <span className="font-medium">Declare what travelers can hire you for</span>
                      <span className="text-[#0a2225]/60"> — your hire form is generic until you do.</span>
                    </span>
                    <span className="font-secondary text-lg leading-none text-[#8D6B2F]">→</span>
                  </button>
                )}
                {items.map((service) => (
                    <div
                      key={service.id}
                      className="snap-start shrink-0 w-[300px] md:w-[320px] bg-white rounded-xl border border-[#E5DFC6] overflow-hidden group hover:shadow-md transition-shadow relative"
                    >
                      {/* Owner menu */}
                      {isOwnProfile && (
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => setMenuOpen(menuOpen === service.id ? null : service.id)}
                            className="h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white"
                          >
                            <MoreVertical className="h-4 w-4 text-[#6B7280]" />
                          </button>
                          {menuOpen === service.id && (
                            <div className="absolute right-0 mt-1 bg-white border border-[#E5DFC6] rounded-lg shadow-lg py-1 w-32 z-20">
                              <button
                                onClick={() => { setEditService(service); setDialogOpen(true); setMenuOpen(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#0a2225] hover:bg-[#FDF9F0]"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(service.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cover image */}
                      {service.cover_image_url && (
                        <div className="aspect-[4/3] overflow-hidden">
                          <img src={service.cover_image_url} alt={service.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
                        </div>
                      )}

                      <div className="p-5">
                        <h3 className="font-secondary text-lg text-[#0a2225] leading-snug">{service.title}</h3>
                        {service.description && (
                          <p className="text-sm text-[#6B7280] mt-1.5 line-clamp-2">{service.description}</p>
                        )}

                        {/* Price + meta */}
                        <div className="flex items-center gap-3 mt-4 flex-wrap">
                          <span className="text-base font-semibold text-[#0a2225]">
                            From {formatPrice(service.starting_price_cents, service.currency)}{tierKey === "on_trip" ? "/day" : ""}
                          </span>
                          {service.delivery_days && tierKey !== "add_on" && (
                            <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                              <Clock className="h-3 w-3" />
                              {service.delivery_time_option || `${service.delivery_days}d`} delivery
                            </span>
                          )}
                          {tierKey === "add_on" && service.duration_minutes && (
                            <span className="text-xs text-[#9CA3AF]">{service.duration_minutes} min</span>
                          )}
                        </div>

                        {/* Trip days + revisions for itinerary tiers */}
                        {(tierKey === "custom_itinerary" || tierKey === "full_trip_design") && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-[#9CA3AF]">
                            {service.trip_days && <span>{service.trip_days}-day trip</span>}
                            {service.revisions != null && service.revisions > 0 && <span>{service.revisions} revision{service.revisions > 1 ? "s" : ""}</span>}
                            {tierKey === "full_trip_design" && service.has_priority_support && (
                              <span className="flex items-center gap-0.5 text-[#C7A962]">
                                <Shield className="h-3 w-3" /> Priority
                              </span>
                            )}
                          </div>
                        )}

                        {/* Includes */}
                        {service.includes.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {service.includes.slice(0, 4).map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[#6B7280]">
                                <span className="text-[#C7A962] mt-0.5">—</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Requirements — what the traveler will be asked for at booking */}
                        {service.requirements.length > 0 && (
                          <p className="mt-3 text-xs text-[#9CA3AF]">
                            Collects {service.requirements.length} detail{service.requirements.length > 1 ? "s" : ""} from you at booking
                          </p>
                        )}

                        {/* FAQ — native disclosure, no extra state needed */}
                        {service.faq.length > 0 && (
                          <details className="mt-3 group">
                            <summary className="text-sm font-medium text-[#0c4d47] cursor-pointer list-none flex items-center gap-1">
                              FAQ ({service.faq.length}) <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                            </summary>
                            <div className="mt-2 space-y-2.5">
                              {service.faq.map((item, i) => (
                                <div key={i}>
                                  <p className="text-xs font-semibold text-[#0a2225]">{item.question}</p>
                                  <p className="text-xs text-[#6B7280] mt-0.5">{item.answer}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}

                        {/* CTA — public visitors only. Routes into the trip-request
                            flow carrying the service context; on_trip additionally
                            flags the request as an on-trip hire at the listed rate.
                            (The previous version of this button had no onClick.) */}
                        {!isOwnProfile && requestBaseParams && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/post-trip?${requestBaseParams}&service=${encodeURIComponent(service.title)}` +
                                  (tierKey === "on_trip"
                                    ? `&hire=on-trip&hireRate=${Math.round(service.starting_price_cents / 100)}`
                                    : "")
                              )
                            }
                            className={
                              tierKey === "on_trip"
                                ? "mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-5 py-2.5 text-sm font-medium text-[#f7f3ea] transition-colors hover:bg-[#0a2225]"
                                : "mt-4 text-sm font-medium text-[#0c4d47] flex items-center gap-1 hover:gap-2 transition-all"
                            }
                          >
                            {config.cta} <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </>
      ) : isOwnProfile ? (
        /* Empty state: clear intro + tier picker */
        <div>
          <div className="mb-6 max-w-2xl">
            <h3 className="font-secondary text-2xl md:text-[28px] text-[#0a2225] mb-3">
              Turn your taste into income
            </h3>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
              Beyond selling fixed itinerary guides, you can offer personalised services that travelers request directly from your profile. You get paid when work is delivered — choose a tier below to get started.
            </p>
            <p className="text-xs text-[#9A9384]">
              Looking to sell a downloadable guide instead? <a href="/itinerary-builder" className="underline text-[#0c4d47]">Use the Itinerary Builder</a>. Selling a scheduled tour? <a href="/trip-builder" className="underline text-[#0c4d47]">Create it in the Trip Builder</a> and choose "Bookable Tour".
            </p>
          </div>

          {/* Trust strip — one real number (your actual tier commission), two true policy statements. No invented figures. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E5DFC6] border border-[#E5DFC6] rounded-2xl overflow-hidden mb-8">
            <div className="bg-white px-6 py-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Wallet className="h-4 w-4 text-[#0c4d47]" />
                <p className="text-2xl font-bold text-[#0c4d47]">{youKeepPct}%</p>
              </div>
              <p className="text-xs text-[#6B7280]">You keep on every booking</p>
            </div>
            <div className="bg-white px-6 py-5">
              <div className="flex items-center gap-2 mb-1.5">
                <CalendarCheck className="h-4 w-4 text-[#0c4d47]" />
                <p className="text-base font-semibold text-[#0a2225]">Paid on delivery</p>
              </div>
              <p className="text-xs text-[#6B7280]">Not just on request</p>
            </div>
            <div className="bg-white px-6 py-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Tag className="h-4 w-4 text-[#0c4d47]" />
                <p className="text-base font-semibold text-[#0a2225]">You set the price</p>
              </div>
              <p className="text-xs text-[#6B7280]">Full control, no fixed rates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TIERS.map((t) => {
              const T = t;
              const isFlagship = Boolean(t.tag);
              return (
                <div
                  key={t.value}
                  className={`relative flex flex-col rounded-2xl bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    isFlagship ? "border-2 border-[#C7A962] shadow-md" : "border border-[#E5DFC6]"
                  }`}
                >
                  {t.tag && (
                    <span className="absolute -top-3 left-6 bg-[#C7A962] text-[#0a2225] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      {t.tag}
                    </span>
                  )}

                  <div
                    className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4 ${TIER_CONFIG[t.value].badge}`}
                  >
                    <T.icon className="h-6 w-6" />
                  </div>

                  <p className="font-secondary text-xl text-[#0a2225] mb-1">{t.label}</p>
                  <p className="text-xs text-[#9CA3AF] mb-4">{t.desc}</p>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {t.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                        <Check className="h-3.5 w-3.5 text-[#0c4d47] mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => { setEditService(null); setPendingTier(t.value); setDialogOpen(true); }}
                    className={`flex items-center justify-center gap-1.5 w-full rounded-full py-2.5 text-sm font-semibold transition-all ${
                      isFlagship
                        ? "bg-[#0c4d47] text-white hover:bg-[#0a3d39]"
                        : "border border-[#0c4d47] text-[#0c4d47] hover:bg-[#0c4d47] hover:text-white"
                    }`}
                  >
                    Create {t.label.toLowerCase()} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Add/Edit dialog */}
      <AddServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        creatorId={creatorId}
        onCreated={fetchServices}
        editService={editService}
        initialTier={pendingTier}
      />
    </div>
  );
}

// Re-export TIERS for empty state usage
const TIERS = [
  {
    value: "on_trip" as ServiceTier,
    label: "On-Trip",
    desc: "Travel with clients, priced per day",
    icon: Plane,
    features: [
      "Join travelers on their own trip as guide and creator",
      "You set a day rate; final total agreed by proposal",
      "Escrow-protected \u2014 paid deposit up front, rest after the trip",
    ],
  },
  {
    value: "custom_itinerary" as ServiceTier,
    label: "Custom Itinerary",
    desc: "Personalized day-by-day plans",
    icon: PenLine,
    features: [
      "Day-by-day plan matched to their dates and style",
      "Delivered as a personal digital itinerary",
      "Revisions included until it's right",
    ],
  },
  {
    value: "full_trip_design" as ServiceTier,
    label: "Full Trip Design",
    desc: "Premium end-to-end planning",
    icon: Star,
    tag: "Most comprehensive",
    features: [
      "End-to-end planning, including bookings",
      "Restaurant and experience recommendations",
      "Priority support available for travelers",
    ],
  },
  {
    value: "add_on" as ServiceTier,
    label: "Add-On",
    desc: "Optional extras & calls",
    icon: CirclePlus,
    features: [
      "Fast-turnaround, focused help",
      "Planning calls, lists, or quick advice",
      "Built for travelers with an existing trip",
    ],
  },
];
