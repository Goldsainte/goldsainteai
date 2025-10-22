import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, ExternalLink, Phone, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAmadeusRestaurantDetails, GooglePlacesRestaurant, getPhotoUrl } from "@/lib/amadeusRestaurantHelpers";

export default function RestaurantDetail() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<GooglePlacesRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!restaurantId) return;
      
      console.debug(`🍽️ Loading restaurant details for place_id: ${restaurantId}`);
      setLoading(true);
      
      try {
        const data = await fetchAmadeusRestaurantDetails(restaurantId);
        
        if (data) {
          console.debug(`✅ Loaded restaurant: ${data.name}`);
          setRestaurant(data);
        } else {
          console.error('❌ Failed to load restaurant details - API returned null');
          setRestaurant(null);
        }
      } catch (error) {
        console.error('❌ Error loading restaurant details:', error);
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
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
        <img 
          src={restaurant.photos?.[0]?.photo_reference 
            ? getPhotoUrl(restaurant.photos[0].photo_reference, 1200) 
            : "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="container mx-auto">
            <h1 className="font-secondary text-4xl md:text-5xl text-white font-light mb-2">
              {restaurant.name}
            </h1>
            {restaurant.vicinity && (
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.vicinity}</span>
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
              {restaurant.types && restaurant.types.length > 0 && (
                <>
                  {restaurant.types
                    .filter(t => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t))
                    .slice(0, 3)
                    .map((type, idx) => (
                      <Badge key={idx} variant="secondary" className="px-4 py-2 capitalize">
                        {type.replace(/_/g, ' ')}
                      </Badge>
                    ))
                  }
                </>
              )}
              {restaurant.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-luxury-gold text-luxury-gold" />
                  <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                  {restaurant.user_ratings_total && (
                    <span className="text-muted-foreground">({restaurant.user_ratings_total} reviews)</span>
                  )}
                </div>
              )}
              {restaurant.price_level && (
                <Badge variant="outline" className="px-4 py-2">
                  {'$'.repeat(restaurant.price_level)}
                </Badge>
              )}
            </div>

            <div className="w-20 h-1 bg-luxury-gold mb-6" />
            
            <h2 className="font-secondary text-2xl font-light mb-4">About This Restaurant</h2>
            <p className="text-muted-foreground mb-6">
              {restaurant.editorialSummary?.text || 
                `Discover ${restaurant.name}, ${restaurant.rating ? 'a highly-rated' : 'an exceptional'} dining destination offering a memorable culinary experience.`}
            </p>

            {restaurant.opening_hours?.open_now !== undefined && (
              <div className="mb-6">
                <Badge variant={restaurant.opening_hours.open_now ? "default" : "secondary"} className="text-sm">
                  {restaurant.opening_hours.open_now ? "Open Now" : "Closed"}
                </Badge>
              </div>
            )}

            {/* Primary CTA - Google Maps */}
            <div className="mt-8 p-6 bg-luxury-gold/10 rounded-lg border-2 border-luxury-gold">
              <h3 className="font-secondary text-xl font-light mb-2">Visit This Restaurant</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View details, hours, and directions on Google Maps
              </p>
              <Button 
                size="lg"
                className="w-full bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90"
                onClick={() => window.open(
                  `https://www.google.com/maps/search/?api=1&query=${restaurant.name}&query_place_id=${restaurant.place_id}`,
                  '_blank'
                )}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Google Maps
              </Button>
            </div>
          </Card>

          {/* Contact Information */}
          {(restaurant.formatted_phone_number || restaurant.website) && (
            <Card className="p-6 md:p-8 mb-8">
              <div className="w-20 h-1 bg-luxury-gold mb-6" />
              <h2 className="font-secondary text-2xl font-light mb-4">Contact Information</h2>
              <div className="space-y-4">
                {restaurant.formatted_phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-luxury-gold flex-shrink-0" />
                    <a 
                      href={`tel:${restaurant.formatted_phone_number}`}
                      className="text-luxury-emerald hover:underline"
                    >
                      {restaurant.formatted_phone_number}
                    </a>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-luxury-gold flex-shrink-0" />
                    <a 
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-luxury-emerald hover:underline flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Hours */}
          {restaurant.opening_hours?.weekday_text && restaurant.opening_hours.weekday_text.length > 0 && (
            <Card className="p-6 md:p-8 mb-8">
              <div className="w-20 h-1 bg-luxury-gold mb-6" />
              <h2 className="font-secondary text-2xl font-light mb-4">Hours</h2>
              <div className="space-y-2">
                {restaurant.opening_hours.weekday_text.map((day, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-luxury-gold flex-shrink-0 mt-1" />
                    <p className="text-sm">{day}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reviews */}
          {restaurant.reviews && restaurant.reviews.length > 0 && (
            <Card className="p-6 md:p-8 mb-8">
              <div className="w-20 h-1 bg-luxury-gold mb-6" />
              <h2 className="font-secondary text-2xl font-light mb-4">Recent Reviews</h2>
              <div className="space-y-6">
                {restaurant.reviews.slice(0, 5).map((review, idx) => (
                  <div key={idx} className="border-b last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'fill-luxury-gold text-luxury-gold' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{review.author_name}</span>
                      {review.relative_time_description && (
                        <span className="text-sm text-muted-foreground">· {review.relative_time_description}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Location */}
          {restaurant.geometry?.location && (
            <Card className="p-6 md:p-8">
              <div className="w-20 h-1 bg-luxury-gold mb-6" />
              <h2 className="font-secondary text-2xl font-light mb-4">Location</h2>
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-luxury-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium">{restaurant.vicinity || 'Address'}</p>
                  <p className="text-muted-foreground text-sm">
                    {restaurant.geometry.location.lat.toFixed(6)}, {restaurant.geometry.location.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.open(
                  `https://www.google.com/maps/search/?api=1&query=${restaurant.geometry?.location.lat},${restaurant.geometry?.location.lng}`,
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
