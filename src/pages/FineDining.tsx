import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { FineDiningSearchHero } from "@/components/FineDiningSearchHero";
import { TopDestinationsSection } from "@/components/TopDestinationsSection";
import { CuisineTypeSection } from "@/components/CuisineTypeSection";
import { FineDiningRestaurantCard } from "@/components/FineDiningRestaurantCard";
import { FineDiningFilters, RestaurantFilterState } from "@/components/FineDiningFilters";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildReservationRedirect } from "@/lib/urlHelpers";

interface GooglePlacesRestaurant {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  geometry: { location: { lat: number; lng: number } };
  types: string[];
  photos?: { photo_reference: string; height: number; width: number }[];
  website?: string;
  editorialSummary?: { text: string };
}

const globalCulinaryCities = [
  { name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80" },
  { name: "Tokyo", country: "Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80" },
  { name: "New York", country: "USA", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80" },
  { name: "London", country: "UK", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80" },
  { name: "Dubai", country: "UAE", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80" },
  { name: "Rome", country: "Italy", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80" },
  { name: "Barcelona", country: "Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80" },
  { name: "Singapore", country: "Singapore", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80" },
  { name: "Hong Kong", country: "China", image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80" },
  { name: "Bangkok", country: "Thailand", image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80" },
  { name: "Sydney", country: "Australia", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80" },
  { name: "Buenos Aires", country: "Argentina", image: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=80" },
  { name: "Amsterdam", country: "Netherlands", image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80" },
  { name: "Lisbon", country: "Portugal", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80" },
  { name: "Kyoto", country: "Japan", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80" },
  { name: "Cape Town", country: "South Africa", image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80" },
  { name: "Marrakesh", country: "Morocco", image: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80" },
  { name: "Vancouver", country: "Canada", image: "https://images.unsplash.com/photo-1559511260-66a654ae982d?w=800&q=80" },
  { name: "Rio de Janeiro", country: "Brazil", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80" },
  { name: "Cairo", country: "Egypt", image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80" },
];

const cuisineTypes = [
  { name: "French Fine Dining", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
  { name: "Italian Fine Dining", imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80" },
  { name: "Japanese Fine Dining", imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80" },
  { name: "Modern American Fine Dining", imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" },
  { name: "Steakhouse Fine Dining", imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80" },
  { name: "Seafood Fine Dining", imageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80" },
  { name: "Mediterranean Fine Dining", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80" },
  { name: "Asian Fusion Fine Dining", imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80" },
  { name: "Middle Eastern Fine Dining", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80" },
  { name: "Latin American Fine Dining", imageUrl: "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800&q=80" },
];

export default function FineDining() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<GooglePlacesRestaurant[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localCuisineFilter, setLocalCuisineFilter] = useState<string | null>(null);
  const restaurantsRef = useRef<HTMLDivElement>(null);
  
  const [filters, setFilters] = useState<RestaurantFilterState>({
    priceRange: [1, 4],
    cuisineTypes: [],
    features: [],
    dietary: [],
    minRating: 4.3,
  });

  // Fetch real restaurants from backend
  const fetchRestaurants = async (city: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('restaurants-search-google', {
        body: { 
          city, 
          minRating: filters.minRating,
          maxResults: 50 
        }
      });

      if (error) throw error;

      // Strict filter: only restaurants with valid website (http or https)
      const validRestaurants = (data?.restaurants || []).filter(
        (r: any) => r.website && r.website.startsWith('http')
      );

      // Transform to GooglePlacesRestaurant format
      const transformed = validRestaurants.map((r: any) => ({
        place_id: r.id,
        name: r.name,
        vicinity: city,
        formatted_address: r.location,
        rating: r.rating,
        user_ratings_total: r.userRatingCount || 0,
        price_level: r.priceLevel,
        geometry: { location: { lat: 0, lng: 0 } },
        types: [r.cuisine.toLowerCase().replace(/\s+/g, '_')],
        photos: [{ photo_reference: r.image, height: 400, width: 600 }],
        website: r.website,
        editorialSummary: { text: '' },
      }));

      setRestaurants(transformed);
      
      if (transformed.length === 0) {
        toast.error("No real restaurants with verified websites found in this area");
      } else {
        toast.success(`Found ${transformed.length} verified restaurants`);
      }
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast.error(error.message || "Failed to load restaurant data");
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL params on mount
  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      setSelectedCity(cityParam);
      fetchRestaurants(cityParam);
    }
  }, [searchParams.get('city')]);

  const handleCityClick = (city: { name: string }) => {
    setSelectedCity(city.name);
    setLocalCuisineFilter(null);
    navigate(`/fine-dining?city=${city.name}`);
    fetchRestaurants(city.name);
    
    setTimeout(() => {
      restaurantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCuisineClick = (cuisine: string) => {
    toast.info("Please select a destination first to view restaurants by cuisine");
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: [1, 4],
      cuisineTypes: [],
      features: [],
      dietary: [],
      minRating: 4.3,
    });
    setLocalCuisineFilter(null);
    setSelectedCity(null);
    setRestaurants([]);
    navigate("/fine-dining");
  };

  // Apply filters
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesPrice = !restaurant.price_level || 
      (restaurant.price_level >= filters.priceRange[0] && 
       restaurant.price_level <= filters.priceRange[1]);
    
    const matchesRating = !restaurant.rating || restaurant.rating >= filters.minRating;
    
    return matchesPrice && matchesRating;
  });

  // Get unique cuisines
  const availableCuisines = [...new Set(
    filteredRestaurants.flatMap(r => r.types?.filter(t => 
      !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
    ) || [])
  )].sort();

  // Apply local cuisine filter
  const finalFilteredRestaurants = localCuisineFilter
    ? filteredRestaurants.filter(r => r.types?.includes(localCuisineFilter))
    : filteredRestaurants;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FineDiningSearchHero
        onOpenFilters={() => setFiltersOpen(true)}
      />
      <div className="container mx-auto px-4 py-12 sm:py-14 md:py-16 max-w-7xl">
        {/* Top Destinations Section */}
        <div className="mb-16">
          <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4" />
          <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-2">
            Browse by Destination
          </h2>
          <p className="text-muted-foreground mb-6">
            Explore real verified fine dining restaurants in world-class destinations
          </p>
          <TopDestinationsSection
            destinations={globalCulinaryCities.map(city => ({ destination: city.name, packageCount: 0, imageUrl: city.image }))}
            onDestinationClick={(dest) => {
              const city = globalCulinaryCities.find(c => c.name === dest);
              if (city) handleCityClick(city);
            }}
          />
        </div>

        {/* Cuisine Types Section */}
        <div className="mb-16">
          <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4" />
          <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-2">
            Browse by Cuisine
          </h2>
          <p className="text-muted-foreground mb-6">
            Select a destination above, then filter by cuisine type
          </p>
          <CuisineTypeSection cuisines={cuisineTypes} onCuisineClick={handleCuisineClick} />
        </div>
        
        {/* Restaurants List */}
        <div ref={restaurantsRef} className="space-y-4">
          {selectedCity && (
            <>
              {/* Cuisine Filter Pills */}
              {availableCuisines.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setLocalCuisineFilter(null)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      localCuisineFilter === null
                        ? 'bg-luxury-gold text-luxury-emerald'
                        : 'bg-luxury-ivory/20 text-luxury-emerald hover:bg-luxury-gold/20'
                    }`}
                  >
                    All Cuisines ({filteredRestaurants.length})
                  </button>
                  {availableCuisines.map(cuisine => (
                    <button
                      key={cuisine}
                      onClick={() => setLocalCuisineFilter(cuisine)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        localCuisineFilter === cuisine
                          ? 'bg-luxury-gold text-luxury-emerald'
                          : 'bg-luxury-ivory/20 text-luxury-emerald hover:bg-luxury-gold/20'
                      }`}
                    >
                      {cuisine.replace(/_/g, ' ')} ({filteredRestaurants.filter(r => r.types?.includes(cuisine)).length})
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-8">
                <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4" />
                <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-2">
                  Fine Dining in {selectedCity}
                </h2>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading real restaurant data from Google Places...</p>
                ) : (
                  <p className="text-muted-foreground">
                    {finalFilteredRestaurants.length} verified restaurants with real websites
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Searching for real restaurants...</p>
                </div>
              ) : finalFilteredRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {finalFilteredRestaurants.map(restaurant => (
                    <FineDiningRestaurantCard
                      key={restaurant.place_id}
                      id={restaurant.place_id}
                      name={restaurant.name}
                      city={restaurant.vicinity}
                      cuisine={restaurant.types?.filter(t => 
                        !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
                      ) || []}
                      priceLevel={restaurant.price_level || 3}
                      rating={restaurant.rating}
                      reviewCount={restaurant.user_ratings_total}
                      imageUrl={restaurant.photos?.[0]?.photo_reference}
                      onViewDetails={() => {
                        if (restaurant.website) {
                          window.location.href = buildReservationRedirect(restaurant.website);
                        } else {
                          toast.error(`Website not available for ${restaurant.name}`);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No real restaurants with verified websites match your filters.
                </p>
              )}
            </>
          )}

          {!selectedCity && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Select a destination above to discover verified fine dining restaurants.
              </p>
            </div>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <FineDiningFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearAll={handleClearFilters}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
