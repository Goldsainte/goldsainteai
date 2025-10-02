import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";
import { CompactHotelCard } from "@/components/CompactHotelCard";
import { CompactFlightCard } from "@/components/CompactFlightCard";
import { ResultsMapView } from "@/components/ResultsMapView";
import { HotelFilters } from "@/components/HotelFilters";
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedStarRatings, setSelectedStarRatings] = useState<number[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);

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
          const { data, error } = await supabase.functions.invoke('tripadvisor-search-hotels', {
            body: { location, checkIn, checkOut, guests: parseInt(guests) }
          });

          if (error) throw error;
          const hotelResults = data.results || [];
          setResults(hotelResults);
          setFilteredResults(hotelResults);
        } else if (searchType === "flights") {
          // Extract airport code from "CODE - City" format
          const originCode = origin.split(' - ')[0].trim();
          const destCode = destination.split(' - ')[0].trim();
          
          const { data, error } = await supabase.functions.invoke('amadeus-search-flights', {
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
        } else if (searchType === "packages") {
          // Fetch hotels, flights, and restaurants in parallel
          const [hotelsRes, flightsRes, restaurantsRes] = await Promise.all([
            supabase.functions.invoke('tripadvisor-search-hotels', {
              body: { location, checkIn, checkOut, guests: parseInt(guests) }
            }),
            supabase.functions.invoke('amadeus-search-flights', {
              body: { origin: 'JFK', destination: location, departureDate: checkIn, adults: parseInt(guests) }
            }).catch(() => ({ data: { results: [] }, error: null })),
            supabase.functions.invoke('tripadvisor-search-restaurants', {
              body: { location }
            }).catch(() => ({ data: { results: [] }, error: null }))
          ]);

          const packageResults = [
            ...(hotelsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'hotel' })),
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

    if (location || origin) {
      performSearch();
    } else {
      setLoading(false);
      setResults([]);
      setFilteredResults([]);
    }
  }, [searchType, location, origin, destination, departureDate, returnDate, checkIn, checkOut, guests, adults, children, infants, cabinClass]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...results];

    // Apply price filter
    filtered = filtered.filter((item) => {
      const price = item.price || item.estimated_price || item.priceBreakdown?.grossPrice?.value || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply rating filter
    if (minRating) {
      filtered = filtered.filter((item) => {
        const rating = (item.property?.reviewScore ?? (item.rating ? Number(item.rating) * 2 : 0));
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

    // Apply sorting
    switch (sortBy) {
      case "price":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "review_score":
        filtered.sort((a, b) => {
          const ra = a.property?.reviewScore ?? (a.rating ? Number(a.rating) * 2 : 0);
          const rb = b.property?.reviewScore ?? (b.rating ? Number(b.rating) * 2 : 0);
          return rb - ra;
        });
        break;
      default:
        // Keep recommended order (popularity)
        break;
    }

    setFilteredResults(filtered);
  }, [results, priceRange, minRating, sortBy, selectedAmenities, selectedPropertyTypes, selectedStarRatings]);

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
                  {filteredResults.length} {searchType === "hotels" ? "properties" : searchType === "packages" ? "package options" : "destinations"} in {location}
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
                </div>
              </aside>

              {/* Results List */}
              <main className="lg:col-span-9">
                {/* Map View at Top */}
                {searchType === "hotels" && (
                  <ResultsMapView 
                    location={location || ''} 
                    results={filteredResults}
                    type={searchType}
                  />
                )}

                {viewMode === "list" ? (
                  <div className="space-y-2">
                    {filteredResults.map((result, index) => (
                      searchType === "hotels" ? (
                        <CompactHotelCard
                          key={result.hotel_id || result.dest_id || index}
                          property={result}
                        />
                      ) : searchType === "flights" ? (
                        <CompactFlightCard
                          key={result.id || index}
                          flight={result}
                          dictionaries={result.dictionaries}
                        />
                      ) : (
                        <CompactHotelCard
                          key={result.hotel_id || result.dest_id || index}
                          property={result}
                        />
                      )
                    ))}
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