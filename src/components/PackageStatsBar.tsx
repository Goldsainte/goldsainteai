import { Package, MapPin, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PackageStatsBarProps {
  totalPackages: number;
  totalDestinations: number;
  averageRating: number;
  totalCreators?: number;
}

export const PackageStatsBar = ({
  totalPackages,
  totalDestinations,
  averageRating,
  totalCreators,
}: PackageStatsBarProps) => {
  return (
    <div className="bg-muted/30 py-12 mb-12">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-3 text-primary" />
            <div className="text-3xl font-bold mb-1">{totalPackages}</div>
            <div className="text-sm text-muted-foreground">Travel Packages</div>
          </Card>

          <Card className="p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-3 text-primary" />
            <div className="text-3xl font-bold mb-1">{totalDestinations}</div>
            <div className="text-sm text-muted-foreground">Destinations</div>
          </Card>

          <Card className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-3 text-primary fill-primary" />
            <div className="text-3xl font-bold mb-1">{averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </Card>

          {totalCreators && (
            <Card className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="text-3xl font-bold mb-1">{totalCreators}</div>
              <div className="text-sm text-muted-foreground">Active Creators</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
