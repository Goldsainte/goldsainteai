import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAmadeusRestaurantDetails, AmadeusRestaurant } from "@/lib/amadeusRestaurantHelpers";

export default function RestaurantDetail() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<AmadeusRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!restaurantId) return;
      
      setLoading(true);
      const data = await fetchAmadeusRestaurantDetails(restaurantId);
      setRestaurant(data);
      setLoading(false);
    };

    loadRestaurant();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-1 bg-luxury-gold mx-auto mb-4" />
          <p className="text-muted-foreground">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-secondary text-2xl mb-4">Restaurant not found</h2>
          <Button onClick={() => navigate('/fine-dining')}>
            Back to Restaurants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/fine-dining')}
            className="flex items-center gap-2 text-luxury-emerald hover:text-luxury-emerald/80"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Restaurants</span>
          </button>
          <h1 className="font-secondary text-2xl text-luxury-emerald">Goldsainte</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="container mx-auto">
            <h1 className="font-secondary text-4xl md:text-5xl text-white font-light mb-2">
              {restaurant.name}
            </h1>
            {restaurant.geoCode && (
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="h-4 w-4" />
                <span>Latitude: {restaurant.geoCode.latitude}, Longitude: {restaurant.geoCode.longitude}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Overview */}
          <Card className="p-6 md:p-8 mb-8">
            <div className="flex flex-wrap gap-4 mb-6">
              {restaurant.category && (
                <Badge variant="secondary" className="px-4 py-2">
                  {restaurant.category}
                </Badge>
              )}
              {restaurant.rank && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-luxury-gold text-luxury-gold" />
                  <span className="font-medium">Rank: {restaurant.rank}</span>
                </div>
              )}
            </div>

            <div className="w-20 h-1 bg-luxury-gold mb-6" />
            
            <h2 className="font-secondary text-2xl font-light mb-4">About This Restaurant</h2>
            <p className="text-muted-foreground mb-6">
              Experience exceptional dining at {restaurant.name}. This highly-rated establishment 
              offers an unforgettable culinary journey with expertly crafted dishes and impeccable service.
            </p>

            {restaurant.tags && restaurant.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {restaurant.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Primary CTA - Amadeus Booking */}
            <div className="mt-8 p-6 bg-luxury-gold/10 rounded-lg border-2 border-luxury-gold">
              <h3 className="font-secondary text-xl font-light mb-2">Book Your Table</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Reserve through our partner for the best rates and exclusive benefits
              </p>
              <Button 
                size="lg"
                className="w-full bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90"
                onClick={() => window.open(`https://www.amadeus.com`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Book via Amadeus
              </Button>
            </div>
          </Card>

          {/* Location */}
          {restaurant.geoCode && (
            <Card className="p-6 md:p-8">
              <div className="w-20 h-1 bg-luxury-gold mb-6" />
              <h2 className="font-secondary text-2xl font-light mb-4">Location</h2>
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-luxury-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium">Coordinates</p>
                  <p className="text-muted-foreground">
                    {restaurant.geoCode.latitude}, {restaurant.geoCode.longitude}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.open(
                  `https://www.google.com/maps/search/?api=1&query=${restaurant.geoCode?.latitude},${restaurant.geoCode?.longitude}`,
                  '_blank'
                )}
              >
                View on Google Maps
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
