import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, DollarSign } from "lucide-react";

interface CompactActivityCardProps {
  activity: {
    id: string;
    name: string;
    shortDescription?: string;
    description?: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    pictures?: string[];
    rating?: string;
    bookingLink?: string;
    geoCode?: {
      latitude: number;
      longitude: number;
    };
    categories?: string[];
  };
  searchParams?: any;
}

export const CompactActivityCard = ({ activity }: CompactActivityCardProps) => {
  const imageUrl = activity.pictures?.[0] || '/placeholder.svg';
  const hasRating = activity.rating && parseFloat(activity.rating) > 0;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <img 
              src={imageUrl}
              alt={activity.name}
              className="w-full h-full object-cover rounded-lg"
            loading="lazy"/>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1 mb-1">
              {activity.name}
            </h3>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {activity.shortDescription || activity.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1 font-semibold text-primary">
                <DollarSign className="w-3 h-3" />
                {activity.price.amount} {activity.price.currencyCode}
              </div>
              
              {hasRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#C7A962] text-[#C7A962]" />
                  <span>{activity.rating}</span>
                </div>
              )}
              
              {activity.categories?.[0] && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {activity.categories[0]}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
