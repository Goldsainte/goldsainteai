import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Compass, Users, Briefcase, MapPin, SearchX } from "lucide-react";

interface EmptyStateProps {
  type: "trips" | "creators" | "agents" | "brands" | "trip-requests";
  onAction: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ type, onAction, hasFilters, onClearFilters }: EmptyStateProps) {
  const { t } = useTranslation();
  // Filtered empty state
  if (hasFilters) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#E5DFC6]/30 bg-white p-12 text-center">
        <div className="mb-4 rounded-full bg-[#FBF9F0] p-4">
          <SearchX className="h-8 w-8 text-[#BFAD72]" />
        </div>
        <h3 className="mb-2 font-display text-2xl text-[#0a2225]">{t("mp.empty.noResults", "No results match your filters")}</h3>
        <p className="mb-6 max-w-sm text-sm text-[#4a4a4a]">
          {t("mp.empty.tryAdjusting", "Try adjusting your search criteria or clearing your filters to see all available options.")}
        </p>
        <Button
          onClick={onClearFilters || onAction}
          className="rounded-full bg-[#0c4d47] px-6 py-2.5 font-semibold text-[#E5DFC6] hover:bg-[#073331]"
        >
          {t("mp.empty.clearFilters", "Clear filters")}
        </Button>
      </div>
    );
  }

  const config = {
    trips: {
      icon: MapPin,
      title: t("mp.empty.tripsTitle", "No trips found"),
      description: t("mp.empty.tripsDesc", "Be the first to post your dream journey and let creators build it."),
      actionLabel: t("mp.empty.tripsCta", "Post your dream trip"),
    },
    creators: {
      icon: Users,
      title: t("mp.empty.creatorsTitle", "No creators found"),
      description: t("mp.empty.creatorsDesc", "Check back soon for inspiring travel creators and content partners."),
      actionLabel: t("mp.empty.creatorsCta", "Browse all creators"),
    },
    agents: {
      icon: Briefcase,
      title: t("mp.empty.agentsTitle", "No agents found"),
      description: t("mp.empty.agentsDesc", "Certified travel agents will appear here once verified."),
      actionLabel: t("mp.empty.agentsCta", "Browse all agents"),
    },
    brands: {
      icon: Briefcase,
      title: t("mp.empty.brandsTitle", "No brands found"),
      description: t("mp.empty.brandsDesc", "Verified hotels, residences and brands will appear here once they're live on Goldsainte."),
      actionLabel: t("mp.empty.brandsCta", "Browse all brands"),
    },
    "trip-requests": {
      icon: Compass,
      title: t("mp.empty.briefsTitle", "No traveler briefs yet"),
      description: t("mp.empty.briefsDesc", "When travelers post trip requests, they'll appear here for you to review and propose on."),
      actionLabel: t("mp.empty.briefsCta", "Post your dream trip"),
    },
  };

  const { icon: Icon, title, description, actionLabel } = config[type];

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#E5DFC6]/30 bg-white p-12 text-center">
      <div className="mb-4 rounded-full bg-[#FBF9F0] p-4">
        <Icon className="h-8 w-8 text-[#BFAD72]" />
      </div>
      <h3 className="mb-2 font-display text-2xl text-[#0a2225]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[#4a4a4a]">{description}</p>
      <Button
        onClick={onAction}
        className="rounded-full bg-[#0c4d47] px-6 py-2.5 font-semibold text-[#E5DFC6] hover:bg-[#073331]"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
