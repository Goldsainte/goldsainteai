import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { FineDiningSearchHero } from "@/components/FineDiningSearchHero";
import { TopDestinationsSection } from "@/components/TopDestinationsSection";
import { CuisineTypeSection } from "@/components/CuisineTypeSection";
import { FineDiningRestaurantCard } from "@/components/FineDiningRestaurantCard";
import { FineDiningFilters, RestaurantFilterState } from "@/components/FineDiningFilters";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { GooglePlacesRestaurant } from "@/lib/amadeusRestaurantHelpers";
import { 
  curatedFineDiningByCuisine, 
  curatedFineDiningByCity, 
  CuratedRestaurant,
  regionMapping 
} from "@/lib/curatedFineDining";
import { toast } from "sonner";

const globalCulinaryCities = [
  { name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80" },
  { name: "Tokyo", country: "Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80" },
  { name: "New York City", country: "USA", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80" },
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
  { name: "Seville", country: "Spain", image: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80" },
  { name: "Reykjavik", country: "Iceland", image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80" },
  { name: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80" },
  { name: "Abu Dhabi", country: "UAE", image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&q=80" },
  { name: "Doha", country: "Qatar", image: "https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800&q=80" },
  { name: "Maldives", country: "Maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80" },
  { name: "Bhutan", country: "Bhutan", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&q=80" },
  { name: "Queenstown", country: "New Zealand", image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80" },
  { name: "Havana", country: "Cuba", image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80" },
  { name: "Luxor", country: "Egypt", image: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80" },
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

// Transform curated restaurant to GooglePlaces format for compatibility
const transformToGooglePlacesFormat = (curated: CuratedRestaurant): GooglePlacesRestaurant => ({
  place_id: curated.id,
  name: curated.name,
  vicinity: curated.city,
  formatted_address: curated.address,
  rating: curated.rating,
  user_ratings_total: 0,
  price_level: curated.priceLevel,
  geometry: { location: { lat: 0, lng: 0 } },
  types: ['restaurant', ...curated.cuisine.map(c => c.toLowerCase().replace(/\s+/g, '_'))],
  photos: [{ photo_reference: curated.imageUrl, height: 800, width: 1200 }],
  website: curated.websiteUrl,
  editorial_summary: { overview: curated.description },
});

export default function FineDining() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<GooglePlacesRestaurant[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("Paris");
  const [viewMode, setViewMode] = useState<'city' | 'cuisine'>('city');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<RestaurantFilterState>({
    priceRange: [1, 4],
    cuisineTypes: [],
    features: [],
    dietary: [],
    minRating: 0,
  });

  // Load cached photos from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('restaurant_photos_v1');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (now - timestamp < sevenDays) {
          setPhotoMap(data);
          console.debug('📸 Loaded cached photos:', Object.keys(data).length);
        } else {
          localStorage.removeItem('restaurant_photos_v1');
          console.debug('🗑️ Cleared expired photo cache');
        }
      } catch (e) {
        console.debug('⚠️ Failed to load photo cache:', e);
      }
    }
  }, []);

  // Save photoMap to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(photoMap).length > 0) {
      localStorage.setItem('restaurant_photos_v1', JSON.stringify({
        data: photoMap,
        timestamp: Date.now()
      }));
    }
  }, [photoMap]);

  // Handle URL params on mount and changes
  useEffect(() => {
    const cityParam = searchParams.get('city');
    const cityName = cityParam || "Paris";
    fetchRestaurants(cityName);
  }, [searchParams]);

  // Fetch restaurants based on city name
  const fetchRestaurants = async (
    cityName: string,
    cuisine?: string
  ) => {
    setRestaurants([]);
    setLoading(true);
    setError(null);
    setSelectedCity(cityName);
    
    if (cuisine) {
      const normalized = getCuisineKeyword(cuisine);
      setLastCuisineQuery(normalized);
      console.debug(`🍽️ Cuisine search: "${cuisine}" -> "${normalized}"`);
    } else {
      setLastCuisineQuery(null);
      console.debug(`🌍 General city search: ${cityName}`);
    }
    
    try {
      const results = await fetchAmadeusRestaurantsForLocation(
        cityName,
        cuisine
      );
      
      setRestaurants(results);
      
      // Photo backfill logic
      const missingPhotos = results
        .filter(r => !r.photos?.[0] && !photoMap[r.place_id])
        .map(r => r.place_id);
      
      if (missingPhotos.length > 0) {
        console.debug(`📸 Queuing ${missingPhotos.length} restaurants for photo backfill`);
        setBackfillQueue(prev => [...new Set([...prev, ...missingPhotos])]);
      }
      
      if (results.length === 0 && !error) {
        toast.error(`No ${cuisine || ''} restaurants found in ${cityName}`);
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Unable to load restaurants. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Process photo backfill queue
  useEffect(() => {
    if (backfillQueue.length === 0 || isBackfilling) return;

    const processQueue = async () => {
      setIsBackfilling(true);
      console.debug(`🔄 Processing photo backfill queue (${backfillQueue.length} items)`);
      
      // Process in batches of 3 for concurrency control
      const batchSize = 3;
      const queue = [...backfillQueue];
      
      for (let i = 0; i < queue.length; i += batchSize) {
        const batch = queue.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(async (placeId) => {
            try {
              const details = await fetchAmadeusRestaurantDetails(placeId);
              if (details?.photos?.[0]?.photo_reference) {
                const photoUrl = getPhotoUrl(details.photos[0].photo_reference, 800);
                if (isValidImageUrl(photoUrl)) {
                  console.debug(`✅ Backfilled photo for ${details.name}`);
                  return { placeId, photoUrl };
                }
              }
              return null;
            } catch (error) {
              console.debug(`❌ Failed to backfill photo for ${placeId}:`, error);
              return null;
            }
          })
        );
        
        // Update photoMap with successful results
        const newPhotos: Record<string, string> = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            newPhotos[result.value.placeId] = result.value.photoUrl;
          }
        });
        
        if (Object.keys(newPhotos).length > 0) {
          setPhotoMap(prev => ({ ...prev, ...newPhotos }));
        }
        
        // Small delay between batches to avoid rate limits
        if (i + batchSize < queue.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.debug(`✅ Photo backfill complete`);
      setBackfillQueue([]);
      setIsBackfilling(false);
    };

    processQueue();
  }, [backfillQueue, isBackfilling, photoMap]);

  const handleCityClick = (city: { name: string }) => {
    setSearchQuery("");
    setSelectedCity(city.name);
    setViewMode('city');
    setSelectedCuisine(null);
    const cityRestaurants = curatedFineDiningByCity[city.name] || [];
    setRestaurants(cityRestaurants.map(transformToGooglePlacesFormat));
    navigate(`/fine-dining?city=${city.name}`);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a city to search");
      return;
    }
    
    const cityName = searchQuery.trim();
    handleCityClick({ name: cityName });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    handleCityClick({ name: 'Paris' });
  };

  const handleCuisineClick = (cuisine: string) => {
    setSearchQuery("");
    setSelectedCuisine(cuisine);
    setViewMode('cuisine');
    setSelectedCity("");
    const cuisineRestaurants = curatedFineDiningByCuisine[cuisine] || [];
    setRestaurants(cuisineRestaurants.map(transformToGooglePlacesFormat));
    toast.info(`Showing ${cuisineRestaurants.length} ${cuisine} restaurants worldwide`);
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: [1, 4],
      cuisineTypes: [],
      features: [],
      dietary: [],
      minRating: 0,
    });
    setSearchQuery("");
    setSelectedCuisine(null);
    setViewMode('city');
    handleCityClick({ name: 'Paris' });
  };

  // Apply all filters: search, cuisine, price, rating
  const filteredRestaurants = restaurants.filter(restaurant => {
    // Name search
    const trimmed = searchQuery.trim().toLowerCase();
    const matchesSearch = trimmed === "" || restaurant.name.toLowerCase().includes(trimmed);
    
    // Price range filter
    const matchesPrice = !restaurant.price_level || 
      (restaurant.price_level >= filters.priceRange[0] && 
       restaurant.price_level <= filters.priceRange[1]);
    
    // Rating filter
    const matchesRating = !restaurant.rating || restaurant.rating >= filters.minRating;
    
    return matchesSearch && matchesPrice && matchesRating;
  });

  // Group restaurants by region and then by city for cuisine view
  const groupedByRegionAndCity = viewMode === 'cuisine' && selectedCuisine ? 
    filteredRestaurants.reduce((acc, r) => {
      const city = r.vicinity || 'Unknown';
      const region = regionMapping[city] || 'Other';
      
      if (!acc[region]) acc[region] = {};
      if (!acc[region][city]) acc[region][city] = [];
      acc[region][city].push(r);
      return acc;
    }, {} as Record<string, Record<string, GooglePlacesRestaurant[]>>) 
    : null;

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
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{error}</p>
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRestaurants.map((restaurant) => {
              const rawUrl = restaurant.photos?.[0]?.photo_reference 
                ? getPhotoUrl(restaurant.photos[0].photo_reference, 800)
                : "";
              // Try base URL first, then check photoMap for backfilled photos
              const photoUrl = isValidImageUrl(rawUrl) ? rawUrl : (photoMap[restaurant.place_id] || undefined);
              
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
