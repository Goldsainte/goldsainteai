import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EnhancedPackageCard } from "./EnhancedPackageCard";
import { useNavigate } from "react-router-dom";

interface Package {
  id: string;
  agent_id?: string;
  package_name: string;
  destination: string;
  cover_image_url?: string;
  duration_days: number;
  retail_price: number;
  currency?: string;
  travel_agents?: {
    agency_name: string;
    rating?: number;
    total_reviews?: number;
  };
  max_participants?: number;
  highlights?: any;
  influencer_commission_percentage?: number;
}

interface CategoryPackageSectionProps {
  title: string;
  description?: string;
  packages: Package[];
  myPromotions: any[];
  onRequestPromotion: (packageId: string) => void;
}

export const CategoryPackageSection = ({
  title,
  description,
  packages,
  myPromotions,
  onRequestPromotion,
}: CategoryPackageSectionProps) => {
  const navigate = useNavigate();

  if (packages.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-6 pb-4">
          {packages.slice(0, 8).map((pkg) => (
            <div key={pkg.id} className="w-[350px] inline-block">
              <EnhancedPackageCard
                id={pkg.id}
                packageName={pkg.package_name}
                destination={pkg.destination}
                coverImage={pkg.cover_image_url}
                durationDays={pkg.duration_days}
                retailPrice={pkg.retail_price}
                currency={pkg.currency}
                agencyName={pkg.travel_agents?.agency_name}
                rating={pkg.travel_agents?.rating}
                totalReviews={pkg.travel_agents?.total_reviews}
                maxParticipants={pkg.max_participants}
                highlights={pkg.highlights}
                influencerCommission={pkg.influencer_commission_percentage}
                onViewDetails={() => navigate(`/cocurated-package/${pkg.id}`)}
                onRequestPromotion={() => onRequestPromotion(pkg.id)}
                isPromoting={myPromotions.some(p => p.package_id === pkg.id && p.status === 'active')}
              />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
