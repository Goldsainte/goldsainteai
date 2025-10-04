import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";
import { CompactHotelCard } from "@/components/CompactHotelCard";
import { CompactFlightCard } from "@/components/CompactFlightCard";
import { CompactRestaurantCard } from "@/components/CompactRestaurantCard";
import { CarCard } from "@/components/CarCard";
import { ResultsMapView } from "@/components/ResultsMapView";
import { HotelFilters } from "@/components/HotelFilters";
import { RestaurantFilters } from "@/components/RestaurantFilters";
import { AdvancedEventFilters } from "@/components/AdvancedEventFilters";
import { AdvancedFlightFilters } from "@/components/AdvancedFlightFilters";
import { Button } from "@/components/ui/button";
import { Loader2, SlidersHorizontal, Map, List, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useAuth } from "@/contexts/AuthContext";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addSearch } = useSearchHistory();
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedStarRatings, setSelectedStarRatings] = useState<number[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedEventCategories, setSelectedEventCategories] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [flightDictionaries, setFlightDictionaries] = useState<any>(null);

  const searchType = searchParams.get("type") || "hotels";
  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";
  
// Flight-specific params
const origin = searchParams.get("origin") || "";
const destination = searchParams.get("destination") || "";
const departureDate = searchParams.get("departureDate") || "";
const returnDate = searchParams.get("returnDate") || "";
const cabinClass = searchParams.get("cabinClass") || "ECONOMY";
const adults = searchParams.get("adults") || "1";
const children = searchParams.get("children") || "0";
const infants = searchParams.get("infants") || "0";

// Car-specific params
const pickup = searchParams.get("pickup") || "";
const dropoff = searchParams.get("dropoff") || "";
const pickupDateCar = searchParams.get("pickupDate") || "";
const returnDateCar = searchParams.get("returnDate") || "";
const carTripType = searchParams.get("carTripType") || "round-trip";

// Derived display codes
const pickupCode = pickup ? pickup.split(" - ")[0].trim() : "";
const dropoffCode = dropoff ? dropoff.split(" - ")[0].trim() : pickupCode;

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_booking_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setUserPreferences(data);
          
          // Only apply preferences if user has them enabled
          if (data.use_preferences_in_search !== false) {
            // Apply more preferences to filters from user profile
            if (data.price_range_min !== null && data.price_range_min !== undefined) {
              setPriceRange([data.price_range_min, data.price_range_max || 1000]);
            }
            if (data.min_review_score) {
              setMinRating(data.min_review_score);
            }
            if (data.cuisine_types && data.cuisine_types.length > 0) {
              // Store cuisine types for restaurant filtering
              setUserPreferences((prev: any) => ({ ...prev, cuisine_types: data.cuisine_types }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  useEffect(() => {
    const performSearch = async () => {
      // Normalize search type to singular form for database
      const normalizedType = searchType.replace(/s$/, ''); // Remove trailing 's'
      
      // Save search to history when performing a search
      if (location || origin) {
        addSearch({
          type: normalizedType,
          location: location || origin,
          ...(searchType === "hotels" && checkIn && checkOut && { checkIn, checkOut, guests }),
          ...(searchType === "flights" && departureDate && { checkIn: departureDate }),
          ...(searchType === "events" && checkIn && { checkIn })
        });
      }
      setLoading(true);
      setError(null);
      setResults([]); // Clear previous results immediately

      try {
        if (searchType === "hotels") {
          let hotelResults: any[] = [];
          try {
            const { data, error } = await supabase.functions.invoke('unified-search-hotels', {
              body: { location, checkIn, checkOut, guests: parseInt(guests) }
            });
            if (error) throw error;
            hotelResults = data.results || [];
          } catch (e) {
            console.warn('Unified hotel search failed, attempting fallbacks:', e);
            // Fallback chain just in case
            try {
              const getCityCode = (loc: string): string => {
                const cityMap: { [key: string]: string } = {
                  'charlotte': 'CLT', 'new york': 'NYC', 'los angeles': 'LAX', 'miami': 'MIA',
                  'chicago': 'CHI', 'san francisco': 'SFO', 'las vegas': 'LAS', 'seattle': 'SEA',
                  'boston': 'BOS', 'washington': 'WAS', 'atlanta': 'ATL', 'dallas': 'DFW',
                  'paris': 'PAR', 'london': 'LON', 'tokyo': 'TYO', 'dubai': 'DXB'
                };
                const cityName = loc.split(',')[0].trim().toLowerCase();
                return cityMap[cityName] || 'NYC';
              };
              const cityCode = getCityCode(location);
              const { data } = await supabase.functions.invoke('amadeus-search-hotels', {
                body: { cityCode, checkInDate: checkIn, checkOutDate: checkOut, adults: parseInt(guests), cityName: location }
              });
              hotelResults = data?.results || [];
            } catch {}
            
            if (!hotelResults || hotelResults.length === 0) {
              const { data: expediaData } = await supabase.functions.invoke('expedia-search-hotels', {
                body: { location, checkIn, checkOut, guests: parseInt(guests), rooms: 1 }
              }).catch(() => ({ data: { hotels: [] } } as any));
              hotelResults = expediaData?.hotels || [];
            }
          }

          setResults(hotelResults);
          setFilteredResults(hotelResults);
        } else if (searchType === "flights") {
          // Extract airport code from "CODE - City" format
          const originCode = origin.split(' - ')[0].trim();
          const destCode = destination.split(' - ')[0].trim();
          
          const { data, error } = await supabase.functions.invoke('unified-search-flights', {
            body: { 
              origin: originCode,
              destination: destCode,
              departureDate,
              ...(returnDate && { returnDate }),
              adults: parseInt(adults),
              children: parseInt(children),
              infants: parseInt(infants),
              cabinClass
            }
          });

          if (error) throw error;
          const flightResults = data.results || [];
          setResults(flightResults);
          setFilteredResults(flightResults);
          setFlightDictionaries(data.dictionaries || null);
        } else if (searchType === "destinations") {
          const { data, error } = await supabase.functions.invoke('search-destinations', {
            body: { query: location }
          });

          if (error) throw error;
          const destResults = data.results || [];
          setResults(destResults);
          setFilteredResults(destResults);
        } else if (searchType === "restaurants") {
          const { data, error } = await supabase.functions.invoke('tripadvisor-search-restaurants', {
            body: { location }
          });

          if (error) throw error;
          const restaurantResults = data.results || [];
          setResults(restaurantResults);
          setFilteredResults(restaurantResults);
        } else if (searchType === "cars") {
          const { data, error } = await supabase.functions.invoke('amadeus-search-cars', {
            body: {
              pickupLocation: pickup,
              pickupDate: pickupDateCar,
              dropoffDate: returnDateCar,
              dropoffLocation: dropoff || pickup,
              currencyCode: 'USD'
            }
          });
          if (error) throw error;
          const carResults = data.results || [];
          setResults(carResults);
          setFilteredResults(carResults);
        } else if (searchType === "packages") {
          // Fetch hotels via unified function, plus flights and restaurants in parallel
          const [hotelsRes, flightsRes, restaurantsRes] = await Promise.all([
            supabase.functions.invoke('unified-search-hotels', {
              body: { location, checkIn, checkOut, guests: parseInt(guests) }
            }).catch(() => ({ data: { results: [] }, error: null })),
            supabase.functions.invoke('unified-search-flights', {
              body: { origin: 'JFK', destination: location, departureDate: checkIn, adults: parseInt(guests) }
            }).catch(() => ({ data: { results: [] }, error: null })),
            supabase.functions.invoke('tripadvisor-search-restaurants', {
              body: { location }
            }).catch(() => ({ data: { results: [] }, error: null }))
          ]);

          const hotelsList: any[] = hotelsRes.data?.results || [];

          const packageResults = [
            ...hotelsList.slice(0, 3).map((r: any) => ({ ...r, packageType: 'hotel' })),
            ...(flightsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'flight' })),
            ...(restaurantsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'restaurant' }))
          ];
          setResults(packageResults);
          setFilteredResults(packageResults);
        } else {
          setResults([]);
          setFilteredResults([]);
        }
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.message || 'Failed to search');
      } finally {
        setLoading(false);
      }
    };

    if (searchType === "cars" ? !!pickup : !!(location || origin)) {
      performSearch();
    } else {
      setLoading(false);
      setResults([]);
      setFilteredResults([]);
    }
  }, [searchType, location, origin, destination, departureDate, returnDate, checkIn, checkOut, guests, adults, children, infants, cabinClass, pickup, dropoff, pickupDateCar, returnDateCar, carTripType]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...results];

    // Apply price filter
    if (searchType === "restaurants") {
      // For restaurants, filter by price range if set
      if (priceRange[0] !== 0 || priceRange[1] !== 200) {
        filtered = filtered.filter((item) => {
          const price = item.price_level ? (item.price_level * 50) : 50; // Estimate $ = 50, $$ = 100, etc.
          return price >= priceRange[0] && price <= priceRange[1];
        });
      }
    } else {
      filtered = filtered.filter((item) => {
        const price = searchType === "flights"
          ? Number(item.price?.grandTotal ?? item.price?.total ?? 0)
          : searchType === "cars"
            ? Number(item.price?.total ?? 0)
            : (item.price || item.estimated_price || item.priceBreakdown?.grossPrice?.value || 0);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

// Apply rating filter (skip for restaurants to avoid over-filtering by preferences)
if (minRating && searchType !== "restaurants") {
  filtered = filtered.filter((item) => {
    // Handle different rating formats across search types
    let rating = 0;
    rating = (item.property?.reviewScore ?? (item.rating ? Number(item.rating) * 2 : 0));
    return rating >= minRating;
  });
}

    // Apply property type filter
    if (selectedPropertyTypes.length > 0) {
      filtered = filtered.filter((item) => {
        const propertyType = item.hotel?.type || item.property?.propertyType || item.type || '';
        return selectedPropertyTypes.some(type => 
          propertyType.toLowerCase().includes(type.toLowerCase())
        );
      });
    }

    // Apply star rating filter
    if (selectedStarRatings.length > 0) {
      filtered = filtered.filter((item) => {
        const starRating = item.hotel?.rating || item.property?.starRating || item.rating || 0;
        return selectedStarRatings.includes(Math.floor(Number(starRating)));
      });
    }

    // Apply amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((item) => {
        const itemAmenities = item.hotel?.amenities || item.property?.amenities || item.amenities || [];
        return selectedAmenities.some(amenity => 
          itemAmenities.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase()))
        );
      });
    }

    // Apply cuisine filter for restaurants
    if (searchType === "restaurants" && selectedCuisines.length > 0) {
      filtered = filtered.filter((item) => {
        const cuisineTypes = item.cuisine?.map((c: any) => c.name || c).join(' ').toLowerCase() || '';
        return selectedCuisines.some(cuisine => 
          cuisineTypes.includes(cuisine.toLowerCase())
        );
      });
    }

    // Apply dietary filter for restaurants
    if (searchType === "restaurants" && selectedDietary.length > 0) {
      filtered = filtered.filter((item) => {
        const dietaryOptions = item.dietary_restrictions?.join(' ').toLowerCase() || '';
        return selectedDietary.some(diet => 
          dietaryOptions.includes(diet.toLowerCase())
        );
      });
    }

    // Apply event category filter
    if (searchType === "events" && selectedEventCategories.length > 0) {
      filtered = filtered.filter((item) => {
        const categories = item.classifications?.map((c: any) => 
          c.segment?.name || c.genre?.name || ''
        ).join(' ').toLowerCase() || '';
        return selectedEventCategories.some(cat => 
          categories.includes(cat.toLowerCase())
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price":
        filtered.sort((a, b) => {
          const ap = searchType === "flights"
            ? Number(a.price?.grandTotal ?? a.price?.total ?? 0)
            : searchType === "cars"
              ? Number(a.price?.total ?? 0)
              : (a.price || a.estimated_price || a.priceBreakdown?.grossPrice?.value || 0);
          const bp = searchType === "flights"
            ? Number(b.price?.grandTotal ?? b.price?.total ?? 0)
            : searchType === "cars"
              ? Number(b.price?.total ?? 0)
              : (b.price || b.estimated_price || b.priceBreakdown?.grossPrice?.value || 0);
          return ap - bp;
        });
        break;
      case "price_desc":
        filtered.sort((a, b) => {
          const ap = searchType === "flights"
            ? Number(a.price?.grandTotal ?? a.price?.total ?? 0)
            : searchType === "cars"
              ? Number(a.price?.total ?? 0)
              : (a.price || a.estimated_price || a.priceBreakdown?.grossPrice?.value || 0);
          const bp = searchType === "flights"
            ? Number(b.price?.grandTotal ?? b.price?.total ?? 0)
            : searchType === "cars"
              ? Number(b.price?.total ?? 0)
              : (b.price || b.estimated_price || b.priceBreakdown?.grossPrice?.value || 0);
          return bp - ap;
        });
        break;
      case "review_score":
        filtered.sort((a, b) => {
          let ra = 0;
          let rb = 0;
          if (searchType === "restaurants") {
            ra = Number(a.rating) || 0;
            rb = Number(b.rating) || 0;
          } else {
            ra = a.property?.reviewScore ?? (a.rating ? Number(a.rating) * 2 : 0);
            rb = b.property?.reviewScore ?? (b.rating ? Number(b.rating) * 2 : 0);
          }
          return rb - ra;
        });
        break;
      default:
        // Keep recommended order (popularity)
        break;
    }

    setFilteredResults(filtered);
  }, [results, priceRange, minRating, sortBy, selectedAmenities, selectedPropertyTypes, selectedStarRatings, selectedCuisines, selectedDietary, selectedEventCategories]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
        
        <div className="mb-6">
          <EnhancedSearchBar />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found. Try a different search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Header with Filters and Sorting */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {filteredResults.length} {searchType === "hotels" ? "properties" : searchType === "packages" ? "package options" : searchType === "flights" ? "flights" : searchType === "cars" ? "cars" : "destinations"} {searchType === "flights" ? `from ${origin.split(' - ')[0]} to ${destination.split(' - ')[0]}` : searchType === "cars" ? `from ${pickupCode}${dropoffCode && pickupCode !== dropoffCode ? ` to ${dropoffCode}` : ''}` : `in ${location}`}
                </h2>
                {searchType === "hotels" && checkIn && (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {checkIn} to {checkOut} • {guests} guests
                    </p>
                    {userPreferences && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs font-medium text-primary">
                          Filtering with your saved preferences (${userPreferences.price_range_min || 20}-${userPreferences.price_range_max || 1000}/night, {userPreferences.preferred_hotel_rating || 'any'} stars min)
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {searchType === "cars" && pickupDateCar && (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {pickupDateCar} to {returnDateCar} • {pickupCode}{dropoffCode && pickupCode !== dropoffCode ? ` → ${dropoffCode}` : ''}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mobile Filters */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="sm:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      {searchType === "hotels" || searchType === "packages" ? (
                        <HotelFilters
                          onSortChange={setSortBy}
                          onMinRatingChange={setMinRating}
                          onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                          onAmenitiesChange={setSelectedAmenities}
                          currentSort={sortBy}
                          currentMinRating={minRating || undefined}
                          currentPriceRange={priceRange}
                          resultsCount={filteredResults.length}
                        />
                      ) : searchType === "restaurants" ? (
                        <RestaurantFilters
                          onSortChange={setSortBy}
                          onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                          onCuisineChange={setSelectedCuisines}
                          onDietaryChange={setSelectedDietary}
                          currentSort={sortBy}
                          currentPriceRange={priceRange}
                          resultsCount={filteredResults.length}
                        />
                      ) : searchType === "events" ? (
                        <AdvancedEventFilters
                          onSortChange={setSortBy}
                          onFilterChange={(filters) => {
                            setPriceRange(filters.priceRange);
                            setSelectedEventCategories(filters.categories);
                          }}
                          currentSort={sortBy}
                          resultsCount={filteredResults.length}
                        />
                      ) : searchType === "flights" ? (
                        <AdvancedFlightFilters
                          onSortChange={setSortBy}
                          onFilterChange={(filters) => {
                            setPriceRange(filters.priceRange);
                          }}
                          currentSort={sortBy}
                          resultsCount={filteredResults.length}
                          availableAirlines={[]}
                        />
                      ) : null}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown - Desktop */}
                <Select value={sortBy} onValueChange={setSortBy} >
                  <SelectTrigger className="w-[180px] hidden sm:flex">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Recommended</SelectItem>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="review_score">Guest Rating</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden sm:flex border rounded-lg">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="rounded-l-none"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Filters Sidebar - Desktop */}
              <aside className="hidden sm:block lg:col-span-3">
                <div className="sticky top-4">
                  {searchType === "hotels" || searchType === "packages" ? (
                    <HotelFilters
                      onSortChange={setSortBy}
                      onMinRatingChange={setMinRating}
                      onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                      onAmenitiesChange={setSelectedAmenities}
                      onPropertyTypesChange={setSelectedPropertyTypes}
                      onStarRatingsChange={setSelectedStarRatings}
                      currentSort={sortBy}
                      currentMinRating={minRating || undefined}
                      currentPriceRange={priceRange}
                      resultsCount={filteredResults.length}
                    />
                  ) : searchType === "restaurants" ? (
                    <RestaurantFilters
                      onSortChange={setSortBy}
                      onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                      onCuisineChange={setSelectedCuisines}
                      onDietaryChange={setSelectedDietary}
                      currentSort={sortBy}
                      currentPriceRange={priceRange}
                      resultsCount={filteredResults.length}
                    />
                  ) : searchType === "events" ? (
                    <AdvancedEventFilters
                      onSortChange={setSortBy}
                      onFilterChange={(filters) => {
                        setPriceRange(filters.priceRange);
                        setSelectedEventCategories(filters.categories);
                      }}
                      currentSort={sortBy}
                      resultsCount={filteredResults.length}
                    />
                  ) : searchType === "flights" ? (
                    <AdvancedFlightFilters
                      onSortChange={setSortBy}
                      onFilterChange={(filters) => {
                        setPriceRange(filters.priceRange);
                      }}
                      currentSort={sortBy}
                      resultsCount={filteredResults.length}
                      availableAirlines={[]}
                    />
                  ) : null}
                </div>
              </aside>

              {/* Results List */}
              <main className="lg:col-span-9">
                {/* Map View at Top for hotels, restaurants, and events */}
                {(searchType === "hotels" || searchType === "restaurants" || searchType === "events") && (
                  <ResultsMapView 
                    location={location || ''} 
                    results={filteredResults}
                    type={searchType}
                  />
                )}

                {viewMode === "list" ? (
                  <div className="space-y-2">
                    {filteredResults.map((result, index) => {
                      if (searchType === "hotels") {
                        return (
                          <CompactHotelCard
                            key={`${result.hotel_id || result.dest_id || 'hotel'}-${index}`}
                            property={result}
                          />
                        );
                      } else if (searchType === "flights") {
                        return (
                          <CompactFlightCard
                            key={`${result.id || 'flight'}-${index}`}
                            flight={result}
                            dictionaries={flightDictionaries}
                          />
                        );
                      } else if (searchType === "cars") {
                        return (
                          <CarCard
                            key={`${result.id || result.offerId || 'car'}-${index}`}
                            car={result}
                          />
                        );
                      } else if (searchType === "restaurants") {
                        return (
                          <CompactRestaurantCard
                            key={`${result.id || 'restaurant'}-${index}`}
                            restaurant={result}
                          />
                        );
                      } else {
                        return (
                          <CompactHotelCard
                            key={`${result.hotel_id || result.dest_id || 'pkg'}-${index}`}
                            property={result}
                          />
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div className="h-[calc(100vh-300px)] rounded-lg border bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Map view coming soon</p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;