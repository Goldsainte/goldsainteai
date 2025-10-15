import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PromotedVendor {
  id: string;
  businessName: string;
  rating: number;
  totalReviews: number;
  serviceAreas: string[];
  promotionalMedia: Array<{
    url: string;
    caption: string;
    isCover: boolean;
  }>;
  packages: Array<{
    packageName: string;
    description: string;
    regularPrice: number;
    promotionalPrice: number;
    discountPercentage: number;
  }>;
  tier: string;
}

interface VendorPromotionFeedProps {
  displayContext: 'homepage' | 'search' | 'journey_feed';
  limit?: number;
}

export default function VendorPromotionFeed({ 
  displayContext, 
  limit = 3 
}: VendorPromotionFeedProps) {
  const [promotedVendors, setPromotedVendors] = useState<PromotedVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotedVendors();
  }, []);

  const fetchPromotedVendors = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-promoted-vendors', {
        body: { 
          displayContext,
          limit 
        }
      });

      if (error) throw error;
      setPromotedVendors(data.vendors || []);
    } catch (error: any) {
      console.error('Error fetching promoted vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (vendorId: string) => {
    try {
      await supabase.functions.invoke('track-vendor-promotion-event', {
        body: {
          vendorId,
          eventType: 'impression',
          context: displayContext
        }
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async (vendorId: string) => {
    try {
      await supabase.functions.invoke('track-vendor-promotion-event', {
        body: {
          vendorId,
          eventType: 'click',
          context: displayContext
        }
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleBookNow = (vendorId: string) => {
    trackClick(vendorId);
    toast.success("Opening booking form...");
    // Navigate to booking page
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (promotedVendors.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Featured Transportation Services</h2>
        <Badge variant="outline">Sponsored</Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotedVendors.map((vendor) => {
          // Track impression when vendor card is visible
          useEffect(() => {
            trackImpression(vendor.id);
          }, []);

          return (
            <Card key={vendor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {vendor.promotionalMedia.length > 0 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {vendor.promotionalMedia.slice(0, 5).map((media, idx) => (
                        <CarouselItem key={idx}>
                          <div className="aspect-video relative">
                            <img
                              src={media.url}
                              alt={media.caption || vendor.businessName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm">
                  Sponsored
                </Badge>
                
                {vendor.tier === 'gold' || vendor.tier === 'platinum' ? (
                  <Badge className="absolute top-3 left-3 bg-yellow-500/90 backdrop-blur-sm">
                    ⭐ Featured
                  </Badge>
                ) : null}
              </div>

              <CardHeader>
                <CardTitle className="text-xl">{vendor.businessName}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
                    <span>({vendor.totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.serviceAreas.length} locations</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {vendor.packages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Special Offers</p>
                    {vendor.packages.slice(0, 2).map((pkg, idx) => (
                      <div key={idx} className="p-3 bg-primary/5 rounded-lg border">
                        <p className="font-medium text-sm">{pkg.packageName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="line-through text-xs text-muted-foreground">
                            ${pkg.regularPrice}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            ${pkg.promotionalPrice}
                          </span>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-700 text-xs">
                            {pkg.discountPercentage}% OFF
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleBookNow(vendor.id)}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}