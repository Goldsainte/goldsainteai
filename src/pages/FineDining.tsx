import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { FineDiningSearchHero } from "@/components/FineDiningSearchHero";
import { TopDestinationsSection } from "@/components/TopDestinationsSection";
import { CuisineTypeSection } from "@/components/CuisineTypeSection";
import { FineDiningRestaurantCard } from "@/components/FineDiningRestaurantCard";
import { FineDiningFilters, RestaurantFilterState } from "@/components/FineDiningFilters";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAmadeusRestaurantsForLocation, GooglePlacesRestaurant, getPhotoUrl } from "@/lib/amadeusRestaurantHelpers";
import { findLocationCoordinates } from "@/lib/locationMapping";
import { toast } from "sonner";

const globalCulinaryCities = [
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80" },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80" },
  { name: "New York", country: "USA", latitude: 40.7128, longitude: -74.0060, image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80" },
  { name: "London", country: "UK", latitude: 51.5074, longitude: -0.1278, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80" },
  { name: "Barcelona", country: "Spain", latitude: 41.3851, longitude: 2.1734, image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80" },
  { name: "Rome", country: "Italy", latitude: 41.9028, longitude: 12.4964, image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80" },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80" },
  { name: "Hong Kong", country: "China", latitude: 22.3193, longitude: 114.1694, image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80" },
  { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80" },
  { name: "Copenhagen", country: "Denmark", latitude: 55.6761, longitude: 12.5683, image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80" },
  { name: "Lima", country: "Peru", latitude: -12.0464, longitude: -77.0428, image: "https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800&q=80" },
  { name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332, image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80" },
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093, image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80" },
  { name: "Dubai", country: "UAE", latitude: 25.2048, longitude: 55.2708, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80" },
  { name: "Istanbul", country: "Turkey", latitude: 41.0082, longitude: 28.9784, image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80" },
  { name: "Mumbai", country: "India", latitude: 19.0760, longitude: 72.8777, image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80" },
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

// Helper function to extract the correct cuisine keyword for filtering
const getCuisineKeyword = (cuisine: string): string => {
  const keywordMap: Record<string, string> = {
    'French Fine Dining': 'french',
    'Italian Trattoria': 'italian',
    'Japanese Kaiseki': 'japanese',
    'Chinese Imperial': 'chinese',
    'Indian Fine Dining': 'indian',
    'Thai Royal': 'thai',
    'Mediterranean': 'mediterranean',
    'Middle Eastern': 'middle eastern',
    'Modern American': 'american',
    'Steakhouse': 'steak',
    'Seafood': 'seafood',
    'Fusion': 'restaurant', // broad match for fusion
  };
  return keywordMap[cuisine] || cuisine.split(' ')[0].toLowerCase();
};

export default function FineDining() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<GooglePlacesRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("Paris");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastCuisineQuery, setLastCuisineQuery] = useState<string | null>(null);
  
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
      // Try location mapping first (supports all cities in locationMapping.ts)
      const location = findLocationCoordinates(cityParam);
      if (location) {
        setCurrentCoords({ lat: location.latitude, lng: location.longitude });
        fetchRestaurants(location.latitude, location.longitude, location.name);
      } else {
        // Fallback: check if it's in our culinary cities list
        const city = globalCulinaryCities.find(c => c.name.toLowerCase() === cityParam.toLowerCase());
        if (city) {
          setCurrentCoords({ lat: city.latitude, lng: city.longitude });
          fetchRestaurants(city.latitude, city.longitude, city.name);
        } else {
          toast.error(`Destination "${cityParam}" not found. Try: Paris, Atlanta, Tokyo, etc.`);
          // Default to Paris
          setCurrentCoords({ lat: 48.8566, lng: 2.3522 });
          fetchRestaurants(48.8566, 2.3522, "Paris");
        }
      }
    } else {
      setCurrentCoords({ lat: 48.8566, lng: 2.3522 });
      fetchRestaurants(48.8566, 2.3522, "Paris");
    }
  }, [searchParams]);

  const fetchRestaurants = async (lat: number, lng: number, cityName: string, cuisine?: string) => {
    setRestaurants([]); // Clear old results immediately
    setLoading(true);
    setSelectedCity(cityName);
    setCurrentCoords({ lat, lng });
    
    // Set lastCuisineQuery based on whether we're doing a cuisine-targeted search
    if (cuisine) {
      // Use improved cuisine keyword extraction
      const normalized = getCuisineKeyword(cuisine);
      setLastCuisineQuery(normalized);
      console.debug(`🍽️ Cuisine-targeted search: "${cuisine}" -> normalized: "${normalized}"`);
    } else {
      setLastCuisineQuery(null);
      console.debug(`🌍 General city search (no cuisine filter)`);
    }
    
    console.debug(`🌍 Fetching restaurants for ${cityName} at (${lat}, ${lng})${cuisine ? ` - ${cuisine}` : ''}`);
    const results = await fetchAmadeusRestaurantsForLocation(lat, lng, 10, undefined, undefined, cuisine);
    
    setRestaurants(results);
    setLoading(false);
    
    console.debug(`📊 Backend returned ${results.length} restaurants`);
    
    // Only show toast if no results after retries
    if (results.length === 0) {
      console.debug(`❌ No restaurants found for ${cityName} even after expanding radius`);
      toast.error(`No ${cuisine || ''} restaurants found in ${cityName}`);
    } else {
      console.debug(`✅ Loaded ${results.length} restaurants for ${cityName}`);
    }
  };

  const handleCityClick = (city: { name: string; latitude: number; longitude: number }) => {
    navigate(`/fine-dining?city=${city.name}`);
    fetchRestaurants(city.latitude, city.longitude, city.name);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a destination to search");
      return;
    }

    const location = findLocationCoordinates(searchQuery);
    if (location) {
      console.debug(`🔍 Found location for "${searchQuery}":`, location);
      navigate(`/fine-dining?city=${location.name}`);
      fetchRestaurants(location.latitude, location.longitude, location.name);
    } else {
      toast.error("Destination not found. Try: Paris, Rome, London, Tokyo, New York, etc.");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    // Reset to default city (Paris)
    const paris = globalCulinaryCities.find(c => c.name === "Paris");
    if (paris) {
      navigate("/fine-dining");
      fetchRestaurants(paris.latitude, paris.longitude, "Paris");
    }
  };

  const handleCuisineClick = async (cuisine: string) => {
    setFilters({ ...filters, cuisineTypes: [cuisine] });
    
    // If we have current coordinates, do a cuisine-targeted fetch
    if (currentCoords) {
      toast.info(`Searching for ${cuisine} restaurants...`);
      // Pass the original cuisine string to fetchRestaurants for backend search
      await fetchRestaurants(currentCoords.lat, currentCoords.lng, selectedCity, cuisine);
    } else {
      toast.success(`Filtering by ${cuisine}`);
    }
  };

  // Map cuisine names to Google Places types (ONLY valid types)
  const getCuisineTypes = (cuisine: string): string[] => {
    const mapping: Record<string, string[]> = {
      'French Fine Dining': ['french_restaurant'],
      'Italian Trattoria': ['italian_restaurant'],
      'Japanese Kaiseki': ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant'],
      'Chinese Imperial': ['chinese_restaurant'],
      'Indian Fine Dining': ['indian_restaurant'],
      'Thai Royal': ['thai_restaurant'],
      'Mediterranean': ['mediterranean_restaurant', 'greek_restaurant'],
      'Middle Eastern': ['middle_eastern_restaurant', 'lebanese_restaurant'],
      'Modern American': ['american_restaurant'],
      'Steakhouse': ['steak_house', 'american_restaurant'],
      'Seafood': ['seafood_restaurant'],
      // Removed invalid types: fusion_restaurant, asian_fusion_restaurant
      'Fusion': ['restaurant'],
    };
    return mapping[cuisine] || [];
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: [1, 4],
      cuisineTypes: [],
      features: [],
      dietary: [],
      minRating: 0,
    });
  };

  // Apply all filters: search, cuisine, price, rating
  const filteredRestaurants = restaurants.filter(restaurant => {
    // Name search
    const matchesSearch = searchQuery === "" || restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Cuisine filter - RELAXED MODE when lastCuisineQuery is set
    let matchesCuisine = true;
    if (filters.cuisineTypes.length > 0) {
      if (lastCuisineQuery) {
        // RELAXED: Check name, primaryTypeDisplayName, editorialSummary, generativeSummary
        const keyword = lastCuisineQuery.toLowerCase();
        const primaryType = restaurant.primaryTypeDisplayName?.text?.toLowerCase() || '';
        const name = restaurant.name.toLowerCase();
        const editorial = restaurant.editorialSummary?.text?.toLowerCase() || '';
        const generativeOverview = restaurant.generativeSummary?.overview?.text?.toLowerCase() || '';
        const generativeDescription = restaurant.generativeSummary?.description?.text?.toLowerCase() || '';
        
        matchesCuisine = primaryType.includes(keyword) ||
                        name.includes(keyword) ||
                        editorial.includes(keyword) ||
                        generativeOverview.includes(keyword) ||
                        generativeDescription.includes(keyword);
      } else {
        // STRICT: Check exact type matches
        matchesCuisine = filters.cuisineTypes.some(cuisine => {
          const cuisineTypes = getCuisineTypes(cuisine);
          return restaurant.types?.some(t => cuisineTypes.includes(t));
        });
      }
    }
    
    // Price range filter
    const matchesPrice = !restaurant.price_level || 
      (restaurant.price_level >= filters.priceRange[0] && 
       restaurant.price_level <= filters.priceRange[1]);
    
    // Rating filter
    const matchesRating = !restaurant.rating || restaurant.rating >= filters.minRating;
    
    const result = matchesSearch && matchesCuisine && matchesPrice && matchesRating;
    return result;
  });

  // Debug logging after filtering
  console.debug(`🔍 Filtering: ${restaurants.length} total -> ${filteredRestaurants.length} after filters (mode: ${lastCuisineQuery ? 'targeted/relaxed' : 'strict'})`);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FineDiningSearchHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onOpenFilters={() => setFiltersOpen(true)}
        onClearSearch={handleClearSearch}
      />
      <div className="container mx-auto px-4 py-12 sm:py-14 md:py-16 max-w-7xl">
        {/* Cuisine Types Section - First */}
        <CuisineTypeSection cuisines={cuisineTypes} onCuisineClick={handleCuisineClick} />
        
        {/* Restaurants List - Second */}
        <div className="mb-8">
          <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4" />
          <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-2">
            Restaurants in {selectedCity}
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
            {lastCuisineQuery && filters.cuisineTypes.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Try clearing cuisine filters or searching a different location
              </p>
            )}
          </div>
        )}
        
        {/* Top Destinations Section - Last */}
        <div className="mt-16">
          <TopDestinationsSection
            destinations={globalCulinaryCities.map(city => ({ destination: city.name, packageCount: 0, imageUrl: city.image }))}
            onDestinationClick={(dest) => {
              const city = globalCulinaryCities.find(c => c.name === dest);
              if (city) handleCityClick(city);
            }}
          />
        </div>
      </div>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <FineDiningFilters filters={filters} onFiltersChange={setFilters} onClearAll={handleClearFilters} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
