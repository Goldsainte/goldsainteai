import { useEffect, useState, useCallback } from "react";
import { Clock, ChevronRight, Plus, Map, Compass, Sparkles, MoreVertical, Pencil, Trash2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AddServiceDialog } from "./AddServiceDialog";
import { toast } from "sonner";

type ServiceTier = "custom_itinerary" | "full_trip_design" | "add_on";

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
}

interface Props {
  creatorId: string;
  isOwnProfile?: boolean;
}

const TIER_CONFIG: Record<ServiceTier, { label: string; icon: any; badge: string; cta: string }> = {
  custom_itinerary: {
    label: "Custom Itineraries",
    icon: Map,
    badge: "bg-[#FDF9F0] text-[#0c4d47] border-[#E5DFC6]",
    cta: "Request This",
  },
  full_trip_design: {
    label: "Full Trip Design",
    icon: Compass,
    badge: "bg-[#0c4d47] text-[#FDF9F0] border-[#0c4d47]",
    cta: "Request This",
  },
  add_on: {
    label: "Add-Ons",
    icon: Sparkles,
    badge: "bg-white text-[#0a2225] border-[#E5DFC6]",
    cta: "Add",
  },
};

const TIER_ORDER: ServiceTier[] = ["custom_itinerary", "full_trip_design", "add_on"];

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function CreatorServicesSection({ creatorId, isOwnProfile }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [pendingTier, setPendingTier] = useState<ServiceTier | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    const { data } = await supabase
      .from("creator_services")
      .select("id, title, description, starting_price_cents, currency, delivery_days, includes, cover_image_url, service_tier, trip_days, has_priority_support, duration_minutes, file_url, delivery_time_option, revisions")
      .eq("creator_id", creatorId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    setServices(
      (data || []).map((s: any) => ({
        ...s,
        includes: Array.isArray(s.includes) ? s.includes : [],
        service_tier: s.service_tier || "custom_itinerary",
        has_priority_support: s.has_priority_support || false,
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
  if (services.length === 0 && !isOwnProfile) return null;

  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<ServiceTier, Service[]>>((acc, t) => {
    acc[t] = services.filter((s) => s.service_tier === t);
    return acc;
  }, {} as any);

  const hasAny = services.length > 0;

  return (
    <div>
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
        <div className="space-y-8">
          {TIER_ORDER.map((tierKey) => {
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
                            From {formatPrice(service.starting_price_cents, service.currency)}
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

                        <button className="mt-4 text-sm font-medium text-[#0c4d47] flex items-center gap-1 hover:gap-2 transition-all">
                          {config.cta} <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : isOwnProfile ? (
        /* Empty state: clear intro + tier picker */
        <div>
          <div className="mb-6 max-w-2xl">
            <h3 className="font-secondary text-2xl text-[#0a2225] mb-3">
              Offer custom services from your profile
            </h3>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-2">
              Beyond selling fixed itinerary guides, you can offer personalised services that travelers request directly from your profile. You get paid when work is delivered.
            </p>
            <ul className="text-sm text-[#6B7280] leading-relaxed mb-6 space-y-1">
              <li><strong className="text-[#0a2225]">Custom Itinerary</strong> — A traveler shares their dates and style, you design a one-of-one day-by-day plan.</li>
              <li><strong className="text-[#0a2225]">Full Trip Design</strong> — End-to-end trip planning with bookings, restaurant recs, and revisions.</li>
              <li><strong className="text-[#0a2225]">Add-On</strong> — Short extras like a 30-minute planning call or restaurant list for an existing trip.</li>
            </ul>
            <p className="text-xs text-[#9A9384] mb-8">
              Looking to sell a downloadable guide instead? <a href="/itinerary-builder" className="underline text-[#0c4d47]">Use the Itinerary Builder</a>.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TIERS.map((t) => {
              const T = t;
              return (
                <button
                  key={t.value}
                  onClick={() => { setEditService(null); setPendingTier(t.value); setDialogOpen(true); }}
                  className="rounded-xl border-2 border-dashed border-[#E5DFC6] bg-white/60 p-5 text-left hover:bg-white hover:border-[#0c4d47]/30 hover:shadow-md transition-all group"
                >
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full mb-3 ${TIER_CONFIG[t.value].badge}`}>
                    <T.icon className="h-5 w-5" />
                  </div>
                  <p className="font-secondary text-base text-[#0a2225] mb-1">{t.label}</p>
                  <p className="text-xs text-[#6B7280] leading-relaxed mb-4">{t.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0c4d47] group-hover:gap-2 transition-all">
                    <Plus className="h-3.5 w-3.5" /> Create {t.label.toLowerCase()}
                  </span>
                </button>
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
  { value: "custom_itinerary" as ServiceTier, label: "Custom Itinerary", desc: "Personalized day-by-day plans", icon: Map },
  { value: "full_trip_design" as ServiceTier, label: "Full Trip Design", desc: "Premium end-to-end planning", icon: Compass },
  { value: "add_on" as ServiceTier, label: "Add-On", desc: "Optional extras & calls", icon: Sparkles },
];
