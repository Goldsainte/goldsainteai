import { useState, useEffect, useRef } from "react";
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
  { name: "Italian Fine Dining", imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80" },
  { name: "Japanese Fine Dining", imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80" },
  { name: "Modern American Fine Dining", imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" },
  { name: "Steakhouse Fine Dining", imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80" },
  { name: "Seafood Fine Dining", imageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80" },
  { name: "Mediterranean Fine Dining", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80" },
  { name: "Asian Fusion Fine Dining", imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80" },
  { name: "Middle Eastern Fine Dining", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80" },
  { name: "Latin American Fine Dining", imageUrl: "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800&q=80" },
  { name: "European Contemporary Fine Dining", imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80" },
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
  editorialSummary: { text: curated.description || '' },
});

export default function FineDining() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<GooglePlacesRestaurant[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("Paris");
  const [viewMode, setViewMode] = useState<'city' | 'cuisine'>('city');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [localCuisineFilter, setLocalCuisineFilter] = useState<string | null>(null);
  const restaurantsRef = useRef<HTMLDivElement>(null);
  
  const [filters, setFilters] = useState<RestaurantFilterState>({
    priceRange: [1, 4],
    cuisineTypes: [],
    features: [],
    dietary: [],
    minRating: 0,
  });

  // Handle URL params on mount and changes
  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      const cityRestaurants = curatedFineDiningByCity[cityParam] || [];
      setSelectedCity(cityParam);
      setViewMode('city');
      setSelectedCuisine(null);
      setRestaurants(cityRestaurants.map(transformToGooglePlacesFormat));
    } else {
      // Default to Paris
      handleCityClick({ name: 'Paris' });
    }
  }, [searchParams]);

  const handleCityClick = (city: { name: string }) => {
    setSelectedCity(city.name);
    setViewMode('city');
    setSelectedCuisine(null);
    setLocalCuisineFilter(null);
    const cityRestaurants = curatedFineDiningByCity[city.name] || [];
    setRestaurants(cityRestaurants.map(transformToGooglePlacesFormat));
    navigate(`/fine-dining?city=${city.name}`);
    
    setTimeout(() => {
      restaurantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCuisineClick = (cuisine: string) => {
    setSelectedCuisine(cuisine);
    setViewMode('cuisine');
    setSelectedCity("");
    setLocalCuisineFilter(null);
    const cuisineRestaurants = curatedFineDiningByCuisine[cuisine] || [];
    setRestaurants(cuisineRestaurants.map(transformToGooglePlacesFormat));
    toast.info(`Showing ${cuisineRestaurants.length} ${cuisine} restaurants worldwide`);
    
    setTimeout(() => {
      restaurantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: [1, 4],
      cuisineTypes: [],
      features: [],
      dietary: [],
      minRating: 0,
    });
    setSelectedCuisine(null);
    setLocalCuisineFilter(null);
    setViewMode('city');
    handleCityClick({ name: 'Paris' });
  };

  // Apply filters: price and rating
  const filteredRestaurants = restaurants.filter(restaurant => {
    // Price range filter
    const matchesPrice = !restaurant.price_level || 
      (restaurant.price_level >= filters.priceRange[0] && 
       restaurant.price_level <= filters.priceRange[1]);
    
    // Rating filter
    const matchesRating = !restaurant.rating || restaurant.rating >= filters.minRating;
    
    return matchesPrice && matchesRating;
  });

  // Get unique cuisines from filtered restaurants
  const availableCuisines = [...new Set(
    filteredRestaurants.flatMap(r => r.types?.filter(t => 
      !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
    ) || [])
  )].sort();

  // Apply local cuisine filter
  const finalFilteredRestaurants = localCuisineFilter
    ? filteredRestaurants.filter(r => r.types?.includes(localCuisineFilter))
    : filteredRestaurants;

  // Group restaurants by region and then by city for cuisine view
  const groupedByRegionAndCity = viewMode === 'cuisine' && selectedCuisine ? 
    finalFilteredRestaurants.reduce((acc, r) => {
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
        onOpenFilters={() => setFiltersOpen(true)}
      />
      <div className="container mx-auto px-4 py-12 sm:py-14 md:py-16 max-w-7xl">
        {/* Top Destinations Section - First */}
        <div className="mb-16">
          <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4" />
          <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-2">
            Browse by Destination
          </h2>
          <p className="text-muted-foreground mb-6">
            Explore curated restaurants in 30 world-class culinary destinations
          </p>
          <TopDestinationsSection
            destinations={globalCulinaryCities.map(city => ({ destination: city.name, packageCount: 0, imageUrl: city.image }))}
            onDestinationClick={(dest) => {
              const city = globalCulinaryCities.find(c => c.name === dest);
              if (city) handleCityClick(city);
            }}
          />
        </div>

        {/* Cuisine Types Section - Second */}
        <div className="mb-16">
          <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4" />
          <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-luxury-emerald font-light mb-2">
            Browse by Cuisine
          </h2>
          <p className="text-muted-foreground mb-6">
            Discover restaurants by culinary style from around the world
          </p>
          <CuisineTypeSection cuisines={cuisineTypes} onCuisineClick={handleCuisineClick} />
        </div>
        
        {/* Restaurants List - Last */}
        {viewMode === 'cuisine' && groupedByRegionAndCity ? (
          // Cuisine View: Group by Region → City
          <div ref={restaurantsRef} className="space-y-16">
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
                {selectedCuisine} Restaurants Worldwide
              </h2>
              <p className="text-muted-foreground">{finalFilteredRestaurants.length} restaurants found</p>
            </div>

            {Object.entries(groupedByRegionAndCity)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([region, cities]) => (
                <div key={region} className="space-y-8">
                  <h2 className="text-3xl font-secondary text-luxury-gold border-b border-luxury-gold/30 pb-2">
                    {region}
                  </h2>
                  {Object.entries(cities)
                    .sort((a, b) => b[1].length - a[1].length)
                    .map(([city, cityRestaurants]) => (
                      <div key={city} className="space-y-4">
                        <h3 className="text-2xl font-secondary text-luxury-emerald">
                          {city} ({cityRestaurants.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                          {cityRestaurants.map(restaurant => (
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
                                window.open(restaurant.website, '_blank', 'noopener,noreferrer');
                              } else {
                                toast.error(`Website not available for ${restaurant.name}`);
                              }
                            }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ) : (
          // City View: Single grid
          <div ref={restaurantsRef} className="space-y-4">
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
                {selectedCity ? `Restaurants in ${selectedCity}` : 'All Restaurants'}
              </h2>
              <p className="text-muted-foreground">{finalFilteredRestaurants.length} restaurants found</p>
            </div>
            
            {finalFilteredRestaurants.length > 0 ? (
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
                        window.open(restaurant.website, '_blank', 'noopener,noreferrer');
                      } else {
                        toast.error(`Website not available for ${restaurant.name}`);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No restaurants found matching your criteria.</p>
              </div>
            )}
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
