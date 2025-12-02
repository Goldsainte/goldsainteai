import { useState } from "react";
import { Bed, Car, Shield, ChevronDown, ChevronUp } from "lucide-react";

interface Addon {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  addon_type: string;
}

interface TripAddonsSectionProps {
  addons: Addon[];
}

export function TripAddonsSection({ addons }: TripAddonsSectionProps) {
  if (!addons || addons.length === 0) return null;

  const formatPrice = (price: number, currency = "USD") => {
    if (price === 0) return "Price varies";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAddonIcon = (type: string) => {
    switch (type) {
      case "accommodation":
        return Bed;
      case "transfer":
        return Car;
      case "insurance":
        return Shield;
      default:
        return Bed;
    }
  };

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Add-Ons
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {addons.map((addon) => (
          <AddonCard
            key={addon.id}
            addon={addon}
            icon={getAddonIcon(addon.addon_type)}
            formatPrice={formatPrice}
          />
        ))}
      </div>
    </section>
  );
}

function AddonCard({
  addon,
  icon: Icon,
  formatPrice,
}: {
  addon: Addon;
  icon: React.ElementType;
  formatPrice: (price: number, currency?: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = addon.description && addon.description.length > 100;

  return (
    <div className="rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#E5DFC6]">
            <Icon className="h-5 w-5 text-[#0C4D47]" />
          </div>
          <div>
            <p className="font-medium text-[#0a2225]">{addon.name}</p>
            <p className="text-sm font-semibold text-[#C7B892]">
              {formatPrice(addon.price, addon.currency)}
            </p>
          </div>
        </div>
      </div>

      {addon.description && (
        <div className="mt-3">
          <p className="text-sm text-[#6B7280]">
            {shouldTruncate && !isExpanded
              ? addon.description.slice(0, 100) + "..."
              : addon.description}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#0C4D47]"
            >
              {isExpanded ? (
                <>
                  Read Less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Read More <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
