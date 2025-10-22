import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { RestaurantSearchHero } from "@/components/RestaurantSearchHero";
import { TopDestinationsSection } from "@/components/TopDestinationsSection";
import { CuisineTypeSection } from "@/components/CuisineTypeSection";
import { FineDiningRestaurantCard } from "@/components/FineDiningRestaurantCard";
import { FineDiningFilters, RestaurantFilterState } from "@/components/FineDiningFilters";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAmadeusRestaurantsForLocation, GooglePlacesRestaurant, getPhotoUrl } from "@/lib/amadeusRestaurantHelpers";
import { toast } from "sonner";

const globalCulinaryCities = [
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80" },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80" },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060, image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80" },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80" },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80" },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80" },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694, image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80" },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80" },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683, image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80" },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428, image: "https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800&q=80" },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80" },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80" },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80" },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80" },
];

const cuisineTypes = [
  { name: "French Fine Dining", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
  { name: "Italian Trattoria", imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80" },
  { name: "Japanese Kaiseki", imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80" },
  { name: "Chinese Imperial", imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80" },
  { name: "Indian Fine Dining", imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80" },
  { name: "Thai Royal", imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80" },
  { name: "Mediterranean", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80" },
  { name: "Middle Eastern", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80" },
  { name: "Modern American", imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" },
  { name: "Steakhouse", imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80" },
  { name: "Seafood", imageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80" },
  { name: "Fusion", imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80" },
];

export default function FineDining() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<GooglePlacesRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  
  const [filters, setFilters] = useState<RestaurantFilterState>({
    priceRange: [1, 4],
    cuisineTypes: [],
    features: [],
    dietary: [],
    minRating: 0,
  });

  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      const city = globalCulinaryCities.find(c => c.name.toLowerCase() === cityParam.toLowerCase());
      if (city) {
        fetchRestaurants(city.lat, city.lng, city.name);
        setSelectedCity(city.name);
      }
    } else {
      fetchRestaurants(48.8566, 2.3522, "Paris");
      setSelectedCity("Paris");
    }
  }, [searchParams]);

  const fetchRestaurants = async (lat: number, lng: number, cityName: string) => {
    setLoading(true);
    try {
      const data = await fetchAmadeusRestaurantsForLocation(lat, lng, 5);
      setRestaurants(data);
      if (data.length === 0) {
        toast.info(`No restaurants found in ${cityName}. Try another city.`);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleCityClick = (city: { name: string; lat: number; lng: number }) => {
    setSelectedCity(city.name);
    navigate(`/fine-dining?city=${city.name}`);
    fetchRestaurants(city.lat, city.lng, city.name);
  };

  const handleCuisineClick = (cuisine: string) => {
    setFilters({ ...filters, cuisineTypes: [cuisine] });
    toast.info(`Filtering by ${cuisine}`);
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: [1, 4],
      cuisineTypes: [],
      features: [],
      dietary: [],
      minRating: 0,
    });
    setSelectedQuickFilter("");
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = searchQuery === "" || restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = filters.cuisineTypes.length === 0 || 
      (restaurant.types && filters.cuisineTypes.some(c => 
        restaurant.types?.some(t => t.toLowerCase().includes(c.toLowerCase()))
      ));
    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <RestaurantSearchHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenFilters={() => setFiltersOpen(true)}
        selectedQuickFilter={selectedQuickFilter}
        onQuickFilterSelect={setSelectedQuickFilter}
      />
      <div className="container mx-auto px-4 py-12 sm:py-14 md:py-16 max-w-7xl">
        <TopDestinationsSection
          destinations={globalCulinaryCities.map(city => ({ destination: city.name, packageCount: 0, imageUrl: city.image }))}
          onDestinationClick={(dest) => {
            const city = globalCulinaryCities.find(c => c.name === dest);
            if (city) handleCityClick(city);
          }}
        />
        <CuisineTypeSection cuisines={cuisineTypes} onCuisineClick={handleCuisineClick} />
        <div className="mb-8">
          <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4" />
          <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-2">
            {selectedCity === "all" ? "All Restaurants" : `Restaurants in ${selectedCity}`}
          </h2>
          <p className="text-muted-foreground">{loading ? "Loading..." : `${filteredRestaurants.length} restaurants found`}</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-4 w-3/4" /></div>
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRestaurants.map((restaurant) => {
              const photoUrl = restaurant.photos?.[0]?.photo_reference 
                ? getPhotoUrl(restaurant.photos[0].photo_reference, 800)
                : undefined;
              
              const cuisineTypes = restaurant.types?.filter(t => 
                !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
              ) || [];

              return (
                <FineDiningRestaurantCard
                  key={restaurant.place_id}
                  id={restaurant.place_id}
                  name={restaurant.name}
                  city={restaurant.vicinity}
                  cuisine={cuisineTypes}
                  priceLevel={restaurant.price_level || 3}
                  rating={restaurant.rating}
                  reviewCount={restaurant.user_ratings_total}
                  imageUrl={photoUrl}
                  onViewDetails={() => navigate(`/restaurant/${restaurant.place_id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">No restaurants found</p>
          </div>
        )}
      </div>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <FineDiningFilters filters={filters} onFiltersChange={setFilters} onClearAll={handleClearFilters} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
