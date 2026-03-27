import { useEffect, useState } from "react";
import { Clock, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  title: string;
  description: string | null;
  starting_price_cents: number;
  currency: string;
  delivery_days: number | null;
  includes: string[];
  cover_image_url: string | null;
}

interface Props {
  creatorId: string;
  isOwnProfile?: boolean;
}

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("creator_services")
        .select("id, title, description, starting_price_cents, currency, delivery_days, includes, cover_image_url")
        .eq("creator_id", creatorId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setServices(
        (data || []).map((s: any) => ({
          ...s,
          includes: Array.isArray(s.includes) ? s.includes : [],
        }))
      );
      setLoading(false);
    })();
  }, [creatorId]);

  if (loading) return null;
  if (services.length === 0 && !isOwnProfile) return null;

  return (
    <div>
      {services.length > 0 ? (
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {services.map((service) => (
            <div
              key={service.id}
              className="snap-start shrink-0 w-[300px] md:w-[320px] bg-white rounded-xl border border-[#E5DFC6] overflow-hidden group hover:shadow-md transition-shadow"
            >
              {/* Cover */}
              {service.cover_image_url && (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={service.cover_image_url}
                    alt={service.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              <div className="p-5">
                <h3 className="font-secondary text-lg text-[#0a2225] leading-snug">
                  {service.title}
                </h3>
                {service.description && (
                  <p className="text-sm text-[#6B7280] mt-1.5 line-clamp-2">
                    {service.description}
                  </p>
                )}

                {/* Price + delivery */}
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-base font-semibold text-[#0a2225]">
                    From {formatPrice(service.starting_price_cents, service.currency)}
                  </span>
                  {service.delivery_days && (
                    <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                      <Clock className="h-3 w-3" />
                      {service.delivery_days}d delivery
                    </span>
                  )}
                </div>

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
                  View Details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : isOwnProfile ? (
        <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-10 text-center">
          <p className="font-secondary text-lg text-[#0a2225] mb-2">Add your travel services</p>
          <p className="text-sm text-[#6B7280] mb-5 max-w-sm mx-auto">
            Create service packages like "Custom Italy Itinerary" or "Luxury Honeymoon Planning" so travelers know what you offer.
          </p>
          <Button
            variant="outline"
            className="border-[#E5DFC6] text-[#0a2225] rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add a Service
          </Button>
        </div>
      ) : null}
    </div>
  );
}
